import math
from datetime import datetime
from flask import Flask, render_template, request, json
import sqlite3
import configparser

CFG = configparser.ConfigParser()
app = Flask(__name__)


def getSizes(sizesList):
    q = ""
    for size in sizesList:
        if q != "":
            q += " or "
        a, b = size.split('x')
        q += "width={a} and height={b}".format(a=a, b=b)
    if q != "":
        q = "({q})".format(q=q)
    return q


def getSolveTypes(solvetypesList):
    q = ""
    for solvetype in solvetypesList:
        if q != "":
            q += " or "
        q += "solve_type=\"{st}\"".format(st=solvetype)
    if q != "":
        q = "({q})".format(q=q)
    return q


def getMarathonCount(marathonInt):
    if marathonInt == 0:
        return ""
    return "marathon_length = {v}".format(v=str(marathonInt))


def getDisplayTypes(displaytypesList):
    q = ""
    for displaytype in displaytypesList:
        if q != "":
            q += " or "
        q += "display_type=\"{dt}\"".format(dt=displaytype)
    if q != "":
        q = "({q})".format(q=q)
    return q


def getControlTypes(controlTypesList):
    q = ""
    for controlType in controlTypesList:
        if q != "":
            q += " or "
        q += "controls=\"{ct}\"".format(ct=controlType)
    if q != "":
        q = "({q})".format(q=q)
    return q


def randomPerm(randomPermBool):
    if randomPermBool:
        return "scrambler = \"Random permutation\""
    return ""


def completedCheck(completedBool):
    if completedBool:
        return "completed = 1"
    return ""


def bldCheck(bldBool):
    if bldBool:
        return "(success = 1 or success IS NULL)"
    return ""


def getDataStr(data):
    return [getSizes(data["sizes"]),
            getSolveTypes(data["solvetypes"]),
            getMarathonCount(data["marathoncount"]),
            getDisplayTypes(data["displaytypes"]),
            getControlTypes(data["controltypes"]),
            randomPerm(data["randomPermForced"]),
            completedCheck(data["onlyCompletedForced"]),
            bldCheck(data["noDNFForced"])]


def addPart(q, part):
    if part != "":
        return q + part + " and "
    return q


def getRulesString(data):
    q = "where "
    data = getDataStr(data)
    for part in data:
        q = addPart(q, part)
    if q == "where ":
        return ""
    return q[:-4]


def getsqlfromdb(data):
    sql = """
    select id, width, height, time, moves, tps, scramble, solution, timestamp, move_times from (
        (select single_start_id, single_end_id, timestamp from solves {rules}) as a join
        (single_solves) as b on a.single_start_id<=b.id and b.id<=a.single_end_id join
        (select solve_id, group_concat(time) move_times from (
            (move_times) as a join
            (select id as solve_id, move_times_start_id, move_times_end_id from single_solves) as b
            on b.move_times_start_id<=a.id and a.id<=b.move_times_end_id
        ) group by solve_id) as c on b.id=c.solve_id
    )
    """.format(rules=getRulesString(data))
    print(CFG["LOCAL"]["dbfilepath"])
    return sqlite3.connect(CFG["LOCAL"]["dbfilepath"]).cursor().execute(sql).fetchall()


def truncate(f, n):
    return math.floor(f * 10 ** n) / 10 ** n


def prepareData(rows):
    data = []
    for array in rows:
        d = {};
        d['ID'] = array[0]
        d['Size'] = "{w}x{h}".format(w=array[1], h=array[2])
        d['Time'] = truncate(array[3] / 1000, 3)
        d['Moves'] = int(array[4] / 1000)
        d['TPS'] = truncate(array[5] / 1000, 3)
        d['Scramble'] = array[6]
        d['Solution'] = array[7]
        d['Date'] = datetime.utcfromtimestamp(int(array[8] / 1000))
        data.append(d)
    return data


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/getdata', methods=['POST'])
def getrequest():
    data = request.get_json(force=True)
    q = getRulesString(data)
    rows = getsqlfromdb(data)
    out = prepareData(rows)
    return json.dumps(out)


@app.route('/uploaddb', methods=['POST'])
def uploaddb():
    db = request.files['file']
    try:
        db.save("uploads/solves.db")
        return "Uploaded"
    except Exception as e:
        print(str(e))
        return str(e), 400


@app.route('/getconfig', methods=['POST'])
def getconfig():
    data = {"dbfilepath": CFG["LOCAL"]["dbfilepath"]}
    return json.dumps(data)


@app.route('/changedbpath', methods=['POST'])
def changedbpath():
    data = request.get_json(force=True)
    try:
        CFG["LOCAL"]["dbfilepath"] = data["dbfilepath"]
        with open('config.ini', 'w') as c:
            CFG.write(c)
        return ("Updated")
    except Exception as e:
        print(str(e))
        return str(e), 400


def main():
    CFG.read("config.ini")
    app.run()


if __name__ == "__main__":
    main()
