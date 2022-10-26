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

$(function () {
    $('#getdata').click(function () {
        var mydata = getValues();
        if (mydata != -1){
            console.log(mydata);
            $.ajax({
                url: '/getdata',
                data: mydata,
                type: 'POST',
                success: function (response) {
                    /*What do i get?
                    a list of arrays [id, width, height, time, moves, tps, scramble, solution]
                        (move/time array store in db and can be accesed later by id)
                    */
                    console.log(response.replace("\\\"",""));
                },
                error: function (error) {
                    console.log(error);
                }
            });
        }
      //  else{
            //alert("Your data is bad");
       // }

    });
});

