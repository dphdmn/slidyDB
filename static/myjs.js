$(document).ready(function(){
    getCurrentConfig();
    $("#updatecached").click(function(){
        getData();
    }); 
    $("#dbfilepathChange").click(function(){
        updatePath();
    });
    $("#livemodeCB").change(function(){
        if (livemodeCB.checked){
            startLive();
        }else{
            stopLive();
        }
    });
    $("#liveint").on('input', function(){
        intervalvalue.innerHTML = "Interval(ms): " + liveint.value.toString(); 
    });
    $("#liveint").change(function(){
         interval = liveint.value;
         if(live){
            stopLive();
            livemodeCB.checked=false;
         }

    });
});

function getCurrentConfig(){
    $.ajax({
        url: '/getconfig',
        type: 'POST',
        success: function (response) {
            data = JSON.parse(response);
            path = data["dbfilepath"];
            currentConfig.innerHTML = "Current path: " + path;
        },
        error: function (error) {
            console.log(error);
        }
    });
}

function changeStatusTime(){
    liveModeStatus.innerHTML = "Status: On, next request in: " + timeleft.toString() + " ms";
}
function updateCountDown(){
    if(live){
        if (timeleft>0){
            timeleft -= intervalChange;
            changeStatusTime();
            setTimeout(() => {
                updateCountDown();
            }, intervalChange);
        }
        else{
            liveModeStatus.innerHTML = "Status: Loading data...";
            getData();
        }
    }
}

function checkLive(){
 if(live){
    changeStatusTime();
    timeleft = interval;
    setTimeout(() => {
        updateCountDown();
    }, intervalChange);
 }
}

function startLive(){
    live = true;
    liveModeStatus.innerHTML = "Status: Loading data...";
    getData();
}

function stopLive(){
    live = false;
    liveModeStatus.innerHTML = "Status: Off";
}

function getValues() {
    /*What do i want to send?
    1) list of width and height as NxM strings, empty if any
    2) list of solve types i want, empty if any
    3) marathon count (ONLY IF MARATHON IS CHECKED), 0 if any
    4) list of disaply types, empty if any
    5) list of control types, empty if any (including macro)
    6) Random permutation check request - True or false
    7) only completed check request - True or false
    8) bld suc check request - True or false
    !(IGONRING SKIPPED SCRAMBLES FOR NOW)! SHOULD ADD THEM LATER BUT NO IDEA HOW ///TODO
    */

    let dataValid = true;
    let sizes = []; //1
    let solvetypes = []; //2
    let marathoncount = 0; //3
    let displaytypes = []; //4
    let controltypes = []; //5
    let randomPermForced = randomPermCB.checked; //6
    let onlyCompletedForced = onlyCompletedCB.checked; //7
    let noDNFForced = noDNFCB.checked; //8
    //1
    if (!sizeAny.checked) {
        sizesArray.forEach(element => {
            if (element.checked) {
                sizes.push(element.value);
            }
        });
        if (customsizecb.checked) {
            cs = customSizeInput.value;
            if (cs != '') {
                if (!rgNxM.test(cs)) {
                    alert("Please input valid NxM string");
                    dataValid = false;
                }
                sizes.push(cs.toLowerCase());
            }

        }
    }
    //2
    if (!solvetypeAny.checked) {
        solvetypesArray.forEach(element => {
            if (element.checked) {
                solvetypes.push(element.value);
            }
        });
    }
    //3
    if (marathoncb.checked) {
        mc = marathonCountInput.value;
        if (mc != '' && mc != '1') {
            if (!rgMarathon.test(mc)) {
                alert("Please input valid Marathon counter (2-1000000)");
                dataValid = false;
            }
            marathoncount = parseInt(mc);
        }
    }
    //4
    if (!displaytypeAny.checked) {
        displaytypeArray.forEach(element => {
            if (element.checked) {
                displaytypes.push(element.value);
            }
        });
    }
    //5
    controltypeArray.forEach(element => {
        if (element.checked) {
            controltypes.push(element.value);
        }
    });
    
    var data = {
        "sizes": sizes,
        "solvetypes": solvetypes,
        "marathoncount": marathoncount,
        "displaytypes": displaytypes,
        "controltypes": controltypes,
        "randomPermForced": randomPermForced,
        "onlyCompletedForced": onlyCompletedForced,
        "noDNFForced": noDNFForced
    }
    datajson = JSON.stringify(data);
    if (dataValid){
        return datajson;
    }
    return -1;

}
function marathonSelected(cb) {
    if (cb.checked) {
        marathonCounterSpan.style.display = 'block'
    } else {
        marathonCounterSpan.style.display = 'none'
    }
}
function customSize(cb) {
    if (cb.checked) {
        customSizeBox.style.display = 'block'
    } else {
        customSizeBox.style.display = 'none'
    }
}
function anySolveType(cb) {
    if (cb.checked) {
        sovleTypeDiv.style.display = 'none'
    } else {
        sovleTypeDiv.style.display = 'block'
    }
}
function anyDisplayType(cb) {
    if (cb.checked) {
        displayTypeDiv.style.display = 'none'
    } else {
        displayTypeDiv.style.display = 'block'
    }
}
function anySize(cb) {
    if (cb.checked) {
        sizeBoxes.style.display = 'none'
    } else {
        sizeBoxes.style.display = 'block'
    }
}

function createTable(data){
    tableContainer.innerHTML = "";
    tbl = document.createElement('table');
    const tr = tbl.insertRow();
    headers.forEach(element => {
        const td = tr.insertCell();
        td.appendChild(document.createTextNode(element));
    });
    data.forEach(row => {
        const tr = tbl.insertRow();
        headers.forEach(header => {
            const td = tr.insertCell();
            td.appendChild(document.createTextNode(row[header].toString()));
        });
    });
    tableContainer.appendChild(tbl)
}

function getData(){
    var mydata = getValues();
    if (mydata != -1){
        console.log(mydata);
        $.ajax({
            url: '/getdata',
            data: mydata,
            type: 'POST',
            success: function (response) {
                /*What do i get?
                a list of arrays [id, size, time, moves, tps, scramble, solution, date]
                    (move/time array store in db and can be accesed later by id)
                */
                data = JSON.parse(response);
                data.sort((a, b) => b["ID"] - a["ID"]);
                checkLive();
                createTable(data);
            },
            error: function (error) {
                console.log(error);
            }
        });
    }
}

function updatePath(){
    pathdata = JSON.stringify({"dbfilepath":dbfilepath.value});
    console.log(pathdata);
    $.ajax({
        url: '/changedbpath',
        data: pathdata,
        type: 'POST',
        success: function (response) {
            getCurrentConfig();
        },
        error: function (error) {
            alert("Something is wrong, check the console");
            console.log(error);
        }
    });
}

function uploadFile(){
    console.log("Uploading...");
    const formData = new FormData();
    formData.append("file", dbfile.files[0]);
    $.ajax({
        url: '/uploaddb',
        data: formData,
        type: 'POST',
        processData: false,
        contentType: false,
        success: function (response) {
            console.log("Uploaded!");
            getData();
        },
        error: function (error) {
            console.log(error);
        }
    });
}