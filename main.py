from flask import Flask, render_template, request, json
import sqlite3
from pprint import pprint

app = Flask(__name__)


def getSizes(sizesList):
    # input - strings like 4x4 3x3 15x5...
    q = ""
    for size in sizesList:
        if q != "":
            q += " or "
        a, b = size.split('x')
        q += "width={a} and height={b}".format(a=a, b=b)
    # output - empty string if input was empty, width=4 and height=4 or width=5 and height=5 or width=3 and height=6 in other case
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
        return "success = 1"
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
    return sqlite3.connect("testing/solves.db").cursor().execute(sql).fetchall()


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/getdata', methods=['POST'])
def getrequest():
    data = request.get_json(force=True)
    q = getRulesString(data)
    rows = getsqlfromdb(data)
    return json.dumps(rows)


app.run()
