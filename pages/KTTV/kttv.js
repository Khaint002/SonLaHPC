var matram;
var setIntervalMonitoring;
function truyCap() {
    document.getElementById("footer-instruct-scanQR").classList.add("d-none");
    document.getElementById("result-form").classList.add("d-none");
    $('#qr-popup').hide();
    console.log(HOMEOSAPP.itemHistory);
    
    document.getElementById("footer-stationName").textContent = HOMEOSAPP.itemHistory.CodeWorkStation + " - " + HOMEOSAPP.itemHistory.NameWorkStation;
    matram = localStorage.getItem("MATRAM");
    $("button-modal-loading").click();
    saveHistory(localStorage.getItem('MATRAM'));
    checkTypeWorkstation()
    getDataMonitoring();
}

function saveHistory(code) {
    historyItems = JSON.parse(localStorage.getItem('dataHistory'));
    if (historyItems) {
        historyItems = historyItems.filter(item => item.CodeWorkStation !== code);
        const item = JSON.parse(localStorage.getItem('itemHistory'));
        historyItems.unshift(item);
        if (historyItems.length > 20) {
            historyItems.shift();
        }
    } else {
        historyItems = [];
        const item = JSON.parse(localStorage.getItem('itemHistory'));
        historyItems.push(item);
    }

    localStorage.setItem('dataHistory', JSON.stringify(historyItems));
}

function checkTypeWorkstation() {
    const $ = (id) => document.getElementById(id);
    const hideElements = ["RT", "RH", "RD", "RP", "RN", "SS", "EC", "TN", "QV", "QR", "QN", "VN"];

    // Reset toàn bộ trạng thái hiển thị
    hideElements.forEach(type => {
        $(`box-${type}`).classList.add("d-none");
        $(`chart-${type}`).classList.add("d-none");

        if (["RD", "RN"].includes(type)) {
            $(`box-${type}`).classList.remove("col-12");
            $(`box-${type}`).classList.add("col-6");
        }
    });
    const item = JSON.parse(localStorage.getItem("itemHistory"));
    $("titleRT").textContent = "Nhiệt độ";
    $("titleChartRT").textContent = "biểu đồ nhiệt độ";
    $(`chart-RN72H`).classList.add("d-none");

    switch (item.workstationType) {
        case "NAAM":
            ["RT", "RH", "RD", "RP"].forEach(type => {
                $(`box-${type}`).classList.remove("d-none");
                $(`chart-${type}`).classList.remove("d-none");
            });
            break;

        case "N":
            ["RN"].forEach(type => {
                $(`box-${type}`).classList.remove("d-none");
                $(`chart-${type}`).classList.remove("d-none");
                $(`chart-RN72H`).classList.remove("d-none");
                $(`box-${type}`).classList.remove("col-6");
                $(`box-${type}`).classList.add("col-12");
                HOMEOSAPP.WorkstationStatistics(
                    localStorage.getItem("URL"),
                        "WORKSTATION_ID='"+localStorage.getItem("MATRAM")+"'", 
                        "NotCentral"
                    ).then(data => {
                        renderChartRN72H(data);
                    }).catch(error => {
                        console.error("Lỗi lấy dữ liệu ChartRN72H:", error);
                    });
                });
            break;
        case "MSL":
        case "M":
        case "MS":
            ["RD"].forEach(type => {
                $(`box-${type}`).classList.remove("d-none");
                $(`chart-${type}`).classList.remove("d-none");
                $(`box-${type}`).classList.remove("col-6");
                $(`box-${type}`).classList.add("col-12");
            });
            break;

        case "NNS":
            ["RN", "RT", "SS", "EC"].forEach(type => {
                $(`box-${type}`).classList.remove("d-none");
                $(`chart-${type}`).classList.remove("d-none");
                $(`chart-RN72H`).classList.remove("d-none");
                if(type == 'RN'){
                    HOMEOSAPP.WorkstationStatistics(
                        localStorage.getItem("URL"),
                        "WORKSTATION_ID='"+localStorage.getItem("MATRAM")+"'", 
                        "NotCentral"
                    ).then(data => {
                        renderChartRN72H(data);
                    }).catch(error => {
                        console.error("Lỗi lấy dữ liệu ChartRN72H:", error);
                    });
                }
                
            });

            // $("box-SS").classList.remove("col-6");
            // $("box-SS").classList.add("col-12");

            $("titleRT").textContent = "Nhiệt độ nước";
            $("titleChartRT").textContent = "biểu đồ nhiệt độ nước";
            break;

        case "TD":
            ["RN", "TN", "QV", "QR"].forEach(type => {
                $(`box-${type}`).classList.remove("d-none");
                $(`chart-${type}`).classList.remove("d-none");
            });
            break;

        case "NMLLTD":
            ["RN", "RD", "QN", "VN"].forEach(type => {
                $(`box-${type}`).classList.remove("d-none");
                $(`chart-${type}`).classList.remove("d-none");
            });
            break;
    }
}

function renderChartRN72H(data) {
    const cfg = chartConfigs.find(c => c.id === "ChartRN72H");
    const labels = [];
    const dataset = [];

    data.forEach(item => {
        labels.push(item.ZONE_NAME.slice(0, 5) + ' ' + item.ZONE_NAME.slice(11, 16) ); // thời gian
        let value = cfg.divideBy10 ? item.ZONE_VALUE : item.ZONE_VALUE;
        value = roundToTwoDecimals(value).toFixed(2);
        dataset.push(value);
    });
    
    const ctx = document.getElementById(cfg.id).getContext('2d');
    const dataSet = [{
        type: cfg.type,
        label: cfg.label,
        data: dataset,
        backgroundColor: cfg.color,
        borderColor: cfg.border,
        borderWidth: 1,
        fill: cfg.fill ? 'start' : false,
        tension: cfg.tension || 0,
        borderDash: cfg.dashed ? [5, 5] : undefined,
        pointRadius: 0,
        pointHoverRadius: 5
    }];

    if (charts[cfg.varName]) charts[cfg.varName].destroy();
    charts[cfg.varName] = new Chart(ctx, HOMEOSAPP.createChart("line", labels, [], cfg.unit, "", dataSet, ""));
}



async function getDataMonitoring() {
    const data = await HOMEOSAPP.getNewData(
        localStorage.getItem("MATRAM"),
        "WORKSTATION_ID='" + localStorage.getItem("MATRAM") + "'",
        localStorage.getItem("URL")
    );
    const item = JSON.parse(localStorage.getItem('itemHistory'));
    const TypeWorkstation = getDayMessage(item.workstationType);
    const dataChart = await HOMEOSAPP.getDataChart('NGAY', '', '', TypeWorkstation, localStorage.getItem("MATRAM"), localStorage.getItem("URL"));
    // const dataChart = await getDataChart('NGAY', '', '', 'RD---', localStorage.getItem("MATRAM"), localStorage.getItem("URL"));
    
    if (dataChart != []) {
        HOMEOSAPP.createChartData(dataChart, 'RD', 'NGAY')
    }

    changeDataHomePage(data.D);
    setIntervalMonitoring = setInterval(async () => {
        const data = await HOMEOSAPP.getNewData(
            localStorage.getItem("MATRAM"),
            "WORKSTATION_ID='" + localStorage.getItem("MATRAM") + "'",
            localStorage.getItem("URL")
        );
        changeDataHomePage(data.D);
    }, 10000);
}

stopIntervalMonitoring = function() {
    // Xóa interval nếu đang chạy
    if (setIntervalMonitoring) {
        clearInterval(setIntervalMonitoring);
        setIntervalMonitoring = null;
    }
}

function getDayMessage(type) {
    switch (type) {
        case "NAAM":
            return 'RD-RT-RH-RP';
        case "N":
            return 'RN---';
        case "MSL":
        case "M":
        case "MS":
            return 'RD---';
        case "NNS":
            return 'RT-RN-SS-EC';
        case "TD":
            return 'RN-TN-QV-QR';
        case "NMLLTD":
            return 'RN-RD-QN-VN';
        default:
            return "";
    }
}

function changeDataHomePage(data) {
    if (!data || data.length === 0) {
        $('#loading-popup').hide(); 
        return;
    }

    const matram = localStorage.getItem('MATRAM');
    const itemw = JSON.parse(localStorage.getItem("itemHistory"));
    const filteredItems = data.filter(item => item.ZONE_ADDRESS === matram);
    console.log(filteredItems);

    let checkRD = false;
    let checkRT = false;

    filteredItems.forEach(item => {
        const { ZONE_PROPERTY, ZONE_VALUE, DATE_CREATE } = item;
        const value = ZONE_VALUE / 10;

        switch (ZONE_PROPERTY) {
            case "RT":
                checkRT = true;
                updateText("RT", value + " °C");
                setRangeValue(value, "success");
                break;

            case "RH":
                updateText("RH", value + " %");
                break;

            case "RA":
                updateText("energy", value + " V");
                updateText("lateDateTime", " " + HOMEOSAPP.getCurrentTime(DATE_CREATE) + "");
                document.getElementById("statusBattery").innerHTML = getBatteryStatus(value);
                handleStatus(DATE_CREATE);
                break;

            case "RP":
                updateText("RP", value + " hPa");
                break;

            case "RD":
                checkRD = true;
                updateText("RD", value + " mm");
                updateText("lastTimeRain", " (" + HOMEOSAPP.getCurrentTime(DATE_CREATE).substring(11) + ")");
                updateBackground("glass", "https://s3-us-west-2.amazonaws.com/s.cdpn.io/54046/glass_droplets.jpeg");
                break;

            case "RN":
                checkRD = true;
                if(itemw.workstationType == 'TD'){
                    updateText("RN", ZONE_VALUE / 100 + " m");
                } else if(itemw.workstationType == 'NMLLTD'){
                    updateText("RN", ZONE_VALUE / 100 + " m");
                } else {
                    updateText("RN", ZONE_VALUE + " cm");
                }
                break;

            case "SS":
                checkRD = true;
                updateText("SS", (ZONE_VALUE / 10000).toFixed(2) + " ppt");
                break;

            case "EC":
                checkRD = true;
                updateText("EC", (ZONE_VALUE / 1000).toFixed(2) + " μs/cm");
                break;
            case "TN":
                checkRD = true;
                updateText("TN", (ZONE_VALUE / 100).toFixed(2) + " tr.m³");
                break;
            case "QV":
                checkRD = true;
                updateText("QV", (ZONE_VALUE / 100).toFixed(2) + " m³/s");
                break;
            case "QR":
                checkRD = true;
                updateText("QR", (ZONE_VALUE / 100).toFixed(2) + " m³/s");
                break;
            case "QN":
                checkRD = true;
                updateText("QN", (ZONE_VALUE / 100).toFixed(2) + " m³/s");
                break;
            case "VN":
                checkRD = true;
                updateText("VN", (ZONE_VALUE / 100).toFixed(2) + " m/s");
                break;
        }
    });
    
    if (!checkRT) setRangeValue(0);
    if (!checkRD) handleNoRainVisual();

    $('#loading-popup').hide();
}

function updateText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function updateBackground(id, url) {
    const el = document.getElementById(id);
    if (el) el.style.background = `url(${url}) center center / cover no-repeat`;
}

function handleStatus(dateString, value) {
    const now = new Date();
    const providedTime = new Date(dateString);
    const diffMinutes = (now - providedTime) / (1000 * 60);

    const status = document.getElementById("status");
    const textStatus = document.getElementById("text-status");

    if (!status || !textStatus) return;

    if (diffMinutes < 15) {
        status.style.background = "green";
        textStatus.textContent = "Đang hoạt động";
        status.classList.add('blinking');
        setTimeout(() => status.classList.remove('blinking'), 3000);
    } else {
        status.style.background = "red";
        textStatus.textContent = "Ngừng hoạt động";
    }

    if(value )

    getCurrentTime(dateString); // (nếu cần dùng để log hoặc cập nhật ngoài)
}

function getBatteryStatus(voltage) {
    if (voltage < 8) {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" style="margin-right: 5px; color: red" fill="currentColor" class="bi bi-battery" viewBox="0 0 16 16">
            <path d="M0 6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1zm14 3a1.5 1.5 0 0 1-1.5 1.5v-3A1.5 1.5 0 0 1 16 8"/>
        </svg>`;
    } else if (voltage < 10.8) {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" style="margin-right: 5px; color: red" fill="currentColor" class="bi bi-battery-half" viewBox="0 0 16 16">
            <path d="M2 6h5v4H2z"/>
            <path d="M2 4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm10 1a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm4 3a1.5 1.5 0 0 1-1.5 1.5v-3A1.5 1.5 0 0 1 16 8"/>
        </svg>`;
    } else if (voltage < 12.4) {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" style="margin-right: 5px; color: yellow" fill="currentColor" class="bi bi-battery-half" viewBox="0 0 16 16">
            <path d="M2 6h5v4H2z"/>
            <path d="M2 4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm10 1a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm4 3a1.5 1.5 0 0 1-1.5 1.5v-3A1.5 1.5 0 0 1 16 8"/>
        </svg>`;
    } else if (voltage > 12.4) {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" style="margin-right: 5px; color: #21ae21" fill="currentColor" class="bi bi-battery-full" viewBox="0 0 16 16">
            <path d="M2 6h10v4H2z"/>
            <path d="M2 4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm10 1a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm4 3a1.5 1.5 0 0 1-1.5 1.5v-3A1.5 1.5 0 0 1 16 8"/>
        </svg>`;
    } else {
        return "Bình thường";
    }
}

function handleNoRainVisual() {
    const hour = new Date().getHours();
    const glass = document.getElementById("glass");
    const landscape = document.getElementById("landscape");

    if (!glass) return;

    if (hour >= 6 && hour < 18) {
        updateBackground("glass", "https://i.pinimg.com/736x/9d/1e/b3/9d1eb31563d0694c0eccd2724b5410a9.jpg");
    } else {
        if (landscape) landscape.classList.add("d-none");
        updateBackground("glass", "https://i.pinimg.com/736x/43/d4/5d/43d45ddb855463920c7505f846bf2900.jpg");
    }
}

$(".homepage-Pre-pickApp").click(function () {
    HOMEOSAPP.stopInterval();
    stopIntervalMonitoring();
    $("#content-block").load("https://sonlahpc.hymetco.com/singlepage/SONLAHPC/pages/menu/menu.html");
});

$("#share-qrcode-workstation").click(function () {
    // Hiển thị popup với hiệu ứng modal
    $("#share-popup").show()

    // Xóa nội dung mã QR cũ
    $('#qrcode').empty();

    // Dữ liệu để tạo mã QR
    const text = localStorage.getItem("URL") + "$" + localStorage.getItem("MATRAM");
    document.getElementById("text-content-QRcode").textContent =
        localStorage.getItem("MATRAM") + " - " + JSON.parse(localStorage.getItem('itemHistory')).NameWorkStation;
    // Tạo mã QR
    QRCode.toCanvas(text, { width: 200 }, function (error, canvas) {
        if (error) {
            console.error("Lỗi khi tạo mã QR:", error);
            alert('Lỗi khi tạo mã QR!');
            return;
        }

        // Thêm canvas QR vào DOM
        $('#qrcode').append(canvas);

        // Tạo ảnh ẩn từ canvas (tùy chọn)
        const image = canvas.toDataURL('image/png');
        const img = $('<img>')
            .attr('src', image)
            .css({ display: 'none' }) // Ẩn ảnh đi
            .attr('id', 'hidden-image');
        $('#qrcode').append(img);
    });
});

$("#BackCodeQR").click(function () {
    $('#share-popup').hide();
});

$(".ScanQRNext").click(function () {
    stopIntervalMonitoring()
    $("#content-block").load("https://sonlahpc.hymetco.com/singlepage/SONLAHPC/pages/History/history.html");
});

$("#button-list-ngay").click(function () {
    clickGetData('NGAY')
});
$("#button-list-tuan").click(function () {
    clickGetData('TUAN')
});
$("#button-list-thang").click(function () {
    clickGetData('THANG')
});
$("#button-list-nam").click(function () {
    clickGetData('NAM')
});

var buttons = document.querySelectorAll(".btn-chart");
buttons.forEach((button) => {
    button.addEventListener("click", function () {
        buttons.forEach((btn) => btn.classList.remove("active"));
        this.classList.add("active");
    });
});

$("#button-list-ngay").click(() => clickGetData("NGAY"));
$("#button-list-tuan").click(() => clickGetData("TUAN"));
$("#button-list-thang").click(() => clickGetData("THANG"));
$("#button-list-nam").click(() => clickGetData("NAM"));

async function clickGetData(type) {
    if (lineBarChart != null) {
        document.getElementById("loading-spinner").classList.remove("d-none");
    }

    const item = JSON.parse(localStorage.getItem("itemHistory"));
    const TypeWorkstation = getDayMessage(item.workstationType);
    const matram = localStorage.getItem("MATRAM");
    const url = localStorage.getItem("URL");

    let fromDate = "";
    let toDate = "";

    if (type === "NAM") {
        const year = new Date().getFullYear();
        fromDate = `${year}-01-01 00$00$00`;
        toDate = `${year}-12-31 23$59$59`;
    }

    const dataChart = await HOMEOSAPP.getDataChart(type, fromDate, toDate, TypeWorkstation, matram, url);

    if (Array.isArray(dataChart) && dataChart.length > 0) {
        HOMEOSAPP.createChartData(dataChart, "RD", type);
    }
}

document.getElementById("dateTimeReport").addEventListener("change", function () {
    console.log(1);
    
    const selectedValue = this.value;
    const { startDate, endDate } = getReportRange(selectedValue);

    // Đổ vào input
    document.getElementById("startDate").value = formatDate(startDate);
    document.getElementById("endDate").value = formatDate(endDate);
});

$("#export-kttv").click(function () {
    getDevicefilter('KTTV');
    renderOptions();
    $("#filter-kttv").removeClass("d-none");
    $("#filter-condition").addClass("d-none");
    $("#export-condition-popup").show();
});

async function getDevicefilter(checkReporttext) {
    if(checkReporttext == 'KTTV'){
        const data = JSON.parse(localStorage.getItem("itemHistory"));
        const dataReport = await HOMEOSAPP.getDataReport('1',"https://"+data.domain+"/service/service.svc");
        const selectElement = $('#KTTV_Report');
        selectElement.empty();

        for (let i = 0; i < dataReport.length; i++) {
            const option = $('<option></option>'); // tạo option bằng jQuery
            option.val(dataReport[i].REPORT_ID);
            option.text(dataReport[i].REPORT_NAME);
            selectElement.append(option); // dùng jQuery append
        }
    } else {
        const data = JSON.parse(localStorage.getItem("itemHistory"));
        const dataDevice = await HOMEOSAPP.getDM("https://"+data.domain+"/service/service.svc", "DM_WORKSTATION_DEVICE", "WORKSTATION_ID='" + data.CodeWorkStation + "'", "NotCentral");
        const selectElement = $('#device_ID_alert');
        selectElement.empty();

        for (let i = 0; i < dataDevice.data.length; i++) {
            const option = $('<option></option>'); // tạo option bằng jQuery
            option.val(processCode(dataDevice.data[i].TRAN_NO));
            option.text(dataDevice.data[i].DESCRIPTION);
            selectElement.append(option); // dùng jQuery append
        }
    }
}

function processCode(code) {
    const prefix = code.slice(0, 2); // lấy 2 chữ đầu
    if (prefix[0] === 'D') {
        return prefix.split('').reverse().join(''); // đảo ngược nếu bắt đầu bằng D
    }
    return prefix;
}

$('#submitExport').click(function () {
    $('#submitExport').css({
        'background-color': '#f39c12',
        'border': 'solid 1px #f39c12'
    });

    // Đổi nội dung text
    $('#submitExport').text('Đang xuất dữ liệu...');
    
    let reportType = $('#KTTV_Report').val();
    
    const startDate = $('#startDate').val();
    const endDate = $('#endDate').val();

    exportRepost('E', startDate, endDate, reportType);
    // Bạn có thể xử lý tiếp ở đây, ví dụ:
    // Gọi API, tạo URL báo cáo, hiển thị kết quả...
});

function DateFormatServerToLocal(input, format) {
    if (!input) return '';

    let dateObj;

    // Nếu là Date object
    if (input instanceof Date) {
        dateObj = input;
    }
    // Nếu là chuỗi, cố gắng parse thành Date
    else if (typeof input === 'string') {
        dateObj = new Date(input);

        // Nếu parse fail (Invalid Date), trả về rỗng
        if (isNaN(dateObj.getTime())) return '';
    } else {
        return '';
    }

    // Lấy từng phần của ngày/giờ
    let dd = String(dateObj.getDate()).padStart(2, '0');
    let mm = String(dateObj.getMonth() + 1).padStart(2, '0'); // Month bắt đầu từ 0
    let yyyy = dateObj.getFullYear();
    let yy = String(yyyy).slice(-2);
    let HH = String(dateObj.getHours()).padStart(2, '0');
    let MM = String(dateObj.getMinutes()).padStart(2, '0');
    let SS = String(dateObj.getSeconds()).padStart(2, '0');

    const map = { dd, mm, yyyy, yy, HH, MM, SS };

    return format.replace(/dd|mm|yyyy|yy|HH|MM|SS/g, (token) => map[token] || '');
}

async function exportRepost(type, startDate, endDate, reportType, isViewer) {
    let checkReport = 'KTTV'
    if (isViewer)
        this.IsViewer = isViewer;
    // startLoading();
    const data = JSON.parse(localStorage.getItem("itemHistory"));
    console.log(data);
    
    // const datetesst =  DateFormatServerToLocal(Sdate.toISOString(), 'dd/mm/yy');
    // console.log(datetesst, ":--", new Date(datetesst));
    // var c = [{"ID":"091840","NAME":"Trực Ninh","IDFIELD":"WORKSTATION_ID","NAMETABLE":"DM_WORKSTATION","REPORT_ID":"RPT_API_MOBILE"},{"ID":"RT","NAME":"Thiết bị đo nhiệt độ","IDFIELD":"ZONE_PROPERTY","NAMETABLE":"VW_COMMAND","REPORT_ID":"RPT_API_MOBILE"}]
    var c = [];
    var linkbase;
    var nameReport;
    if(checkReport == 'KTTV'){
        linkbase = 'https://'+data.domain+'/Service/Service.svc/';
        // c = [{"ID":data.CodeWorkStation,"NAME":data.NameWorkStation,"IDFIELD":"WORKSTATION_ID","NAMETABLE":"DM_WORKSTATION","REPORT_ID":"RPT_API_MOBILE"},{"ID":reportType,"NAME":"","IDFIELD":"ZONE_PROPERTY","NAMETABLE":"VW_COMMAND","REPORT_ID":"RPT_API_MOBILE"}];
        nameReport = reportType;
    } else {
        linkbase = 'https://central.homeos.vn/service_XD/service.svc/';
        nameReport = reportType;
    }
    const dataUser = await checkRoleUser("dev", sha1Encode("1" + "@1B2c3D4e5F6g7H8").toString(), linkbase, "Export");
    
    var val = [];
    
    // val.url = 'https://central.homeos.vn/service_XD/service.svc/' + "GenerateReportOther";
    val.url = linkbase + "GenerateReportOther";
    // this.generateCondition();
    val.data = {
        // Uid: 'admin',
        // Sid: 'cb880c13-5465-4a1d-a598-28e06be43982',
        Uid: dataUser[0].StateName,
        Sid: dataUser[0].StateId,
        PRid: nameReport,
        Rid: nameReport,
        Sd: DateFormatServerToLocal(startDate, 'yyyy/mm/dd'),
        Ed: DateFormatServerToLocal(endDate, 'yyyy/mm/dd'),
        // St: this.txtFromTime.Value(),
        // Et: this.txtToTime.Value(),
        c: JSON.stringify(c),
        type: type
    };
    val.type = "POST";
    val.dataType = "jsonp";
    val.crossDomain = true;
    val.contentType = "application/json; charset=utf-8";
    val.complete = function (data) {
        // finishLoading();
    };
    val.error = function (e, b) {
        alert(b);
        // finishLoading();
    };
    val.success = function (msg) {
        var state = msg;
        console.log(state);
        
        try {
            state = JSON.parse(msg);
            $('#submitExport').css({
                'background-color': '#2c697b',
                'border': 'solid 1px #2c697b'
            });
        
            // Đổi nội dung text
            $('#submitExport').text('Xuất dữ liệu báo cáo (excel)');

            toastr.error("Xuất báo cáo lỗi, vui lòng kiểm tra lại");
            console.log(state);
            // this.MessageBox(state.StateName, "danger", "")
            return;
        } catch (e) {
            state = msg;
        }
        if (state != 'error') {
            if (this.IsViewer) {
                var link = HomeOS.linkbase().toLowerCase().replace('service.svc/', '') + '' + msg;
                link = link.replace('service.svc/', '');
                
                // this.transOutput.LinkDocument = link;
                if (!this.transOutput.is_Initial) {
                    this.transOutput.Form_Loaded = function () {
                        // this.transOutput.fullScreen();
                        // this.transOutput.SetUrl();
                    }.bind(this);
                    this.transOutput.initial(function () {
                        this.transOutput.Show();
                    }.bind(this));
                }
                else {
                    this.transOutput.SetUrl(link);
                    this.transOutput.Show();
                }
                $('#submitExport').css({
                    'background-color': '#2c697b',
                    'border': 'solid 1px #2c697b'
                });
                // Đổi nội dung text
                $('#submitExport').text('Xuất dữ liệu báo cáo (excel)');
            }
            else {
                const urlservice = linkbase
                // const urlservice = 'https://central.homeos.vn/service_XD/service.svc/'
                var link = urlservice.replace('service.svc/', '') + '' + msg;
                link = link.replace('service.svc/', '');
                link = link.replace('Service.svc/', '');
                // link = link.replace('pdf', 'xls');
                if(window.downloadFileToDevice){
                    window.downloadFileToDevice(link);
                    
                    toastr.success("download file thành công ");
                } else {
                    // window.open(link, "download");
                    const a = document.createElement('a');
                    a.href = link;
                    a.download = link.split('/').pop(); // tự lấy tên file từ URL
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    console.log(1);
                }
                $('#submitExport').css({
                    'background-color': '#2c697b',
                    'border': 'solid 1px #2c697b'
                });
                // Đổi nội dung text
                $('#submitExport').text('Xuất dữ liệu báo cáo (excel)');
                console.log(link);
            }
        }
        else {
            this.checkError(msg);
        }
        this.IsViewer = false;
    }.bind(this);
    $.ajax(val);
}

var reportOptions = [
    { value: "CHANGE", text: "Tuỳ ý" },
    { value: "MONTH1", text: "Tháng 1" },
    { value: "MONTH2", text: "Tháng 2" },
    { value: "MONTH3", text: "Tháng 3" },
    { value: "MONTH4", text: "Tháng 4" },
    { value: "MONTH5", text: "Tháng 5" },
    { value: "MONTH6", text: "Tháng 6" },
    { value: "MONTH7", text: "Tháng 7" },
    { value: "MONTH8", text: "Tháng 8" },
    { value: "MONTH9", text: "Tháng 9" },
    { value: "MONTH10", text: "Tháng 10" },
    { value: "MONTH11", text: "Tháng 11" },
    { value: "MONTH12", text: "Tháng 12" },
    { value: "QUY1", text: "Quý 1" },
    { value: "QUY2", text: "Quý 2" },
    { value: "QUY3", text: "Quý 3" },
    { value: "QUY4", text: "Quý 4" },
    { value: "MOMTHSTART", text: "6 tháng đầu năm" },
    { value: "MOMTHEND", text: "6 tháng cuối năm" },
    { value: "MOMTH9START", text: "9 tháng đầu năm" },
    { value: "YEAR", text: "Cả năm" },
];

// Hàm khởi tạo các option trong select
function renderOptions() {
    const $select = $("#dateTimeReport");
    $select.empty(); // Xóa tất cả option hiện có

    reportOptions.forEach(opt => {
        const $option = $("<option></option>")
            .val(opt.value)
            .text(opt.text);
        $select.append($option);
    });
}

$("#BackExportCondition").click(function () {
    $('#export-condition-popup').hide();
});

// Hàm xử lý thời gian theo lựa chọn
function getReportRange(value) {
    const year = new Date().getFullYear();
    let startDate, endDate;

    const date = (m, d) => new Date(year, m - 1, d);

    switch (value) {
        case "CHANGE":
            startDate = null;
            endDate = null;
            break;
        case "MONTH1":
        case "MONTH2":
        case "MONTH3":
        case "MONTH4":
        case "MONTH5":
        case "MONTH6":
        case "MONTH7":
        case "MONTH8":
        case "MONTH9":
        case "MONTH10":
        case "MONTH11":
        case "MONTH12":
            const month = parseInt(value.replace("MONTH", ""));
            startDate = date(month, 1);
            endDate = new Date(year, month, 0); // ngày cuối cùng của tháng
            break;
        case "QUY1":
            startDate = date(1, 1);
            endDate = date(3, 31);
            break;
        case "QUY2":
            startDate = date(4, 1);
            endDate = date(6, 30);
            break;
        case "QUY3":
            startDate = date(7, 1);
            endDate = date(9, 30);
            break;
        case "QUY4":
            startDate = date(10, 1);
            endDate = date(12, 31);
            break;
        case "MOMTHSTART":
            startDate = date(1, 1);
            endDate = date(6, 30);
            break;
        case "MOMTHEND":
            startDate = date(7, 1);
            endDate = date(12, 31);
            break;
        case "MOMTH9START":
            startDate = date(1, 1);
            endDate = date(9, 30);
            break;
        case "YEAR":
            startDate = date(1, 1);
            endDate = date(12, 31);
            break;
        default:
            startDate = null;
            endDate = null;
    }

    return { startDate, endDate };
}

function formatDate(date) {
    if (!date) return '';
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

$("#settingAlert").click(function () {
    // if(DataUser){
        getDevicefilter();
        $("#alert-kttv-popup").show(); 
    // } else {
    //     toastr.error("Vui lòng liên kết tài khoản Zalo để sử dụng chức năng này.");
    // }
    
});

var xmlns = "http://www.w3.org/2000/svg",
xlinkns = "http://www.w3.org/1999/xlink",
select = function (s) {
    return document.querySelector(s);
},
selectAll = function (s) {
    return document.querySelectorAll(s);
},
liquid = selectAll('.liquid'),
tubeShine = select('.tubeShine'),
label = select('.label'),
follower = select('.follower'),
dragger = select('.dragger'),
dragTip = select('.dragTip'),
minDragY = -380,
liquidId = 0,
step = Math.abs(minDragY / 50),
snap = Math.abs(minDragY / 10),
followerVY = 0;

gsap.set('svg', { visibility: 'visible' });
gsap.set(dragTip, { transformOrigin: '20% 50%' });

var tl = gsap.timeline();
tl.to(liquid, { x: '-=200', ease: 'none', repeat: -1, stagger: 0.9 });

tl.time(100);

document.addEventListener('touchmove', function (event) {
event.preventDefault();
});

Draggable.create(dragger, {
    type: 'y',
    bounds: { minY: minDragY, maxY: 0 },
    onDrag: onUpdate,
    throwProps: true,
    throwResistance: 2300,
    onThrowUpdate: onUpdate,
    overshootTolerance: 0,
    snap: function (value) {
        // Optional: snap to steps of 10
        // return Math.round(value / snap) * snap;
    }
});

function onUpdate() {
// Get the current y position of the dragger using gsap.getProperty
    var draggerY = gsap.getProperty(dragger, 'y');
    liquidId = Math.abs(Math.round(draggerY / step));
    label.textContent = liquidId + '°C';;

    gsap.to(liquid, {
        y: draggerY * 1.12,
        ease: 'elastic.out(1, 0.4)',
        duration: 1.3
    });
}

gsap.to(follower, {
y: '+=0',
repeat: -1,
duration: 1,
modifiers: {
    y: function (y) {
        var draggerY = gsap.getProperty(dragger, 'y');
        followerVY += (draggerY - gsap.getProperty(follower, 'y')) * 0.23;
        followerVY *= 0.69;
        return gsap.getProperty(follower, 'y') + followerVY;
    }
}
});

gsap.to(dragTip, {
rotation: '+=0',
repeat: -1,
duration: 1,
modifiers: {
    rotation: function (rotation) {
        return rotation - followerVY;
    }
}
});

gsap.to(label, {
y: '+=0',
repeat: -1,
duration: 1,
modifiers: {
    y: function (y) {
        return y - followerVY * 0.5;
    }
}
});

gsap.to(dragger, {
y: minDragY / 2,
onUpdate: onUpdate,
ease: 'expo.inOut',
duration: 1.4
});
function setRangeValue(value, type) {
// Chuyển đổi giá trị value từ 0-100 thành vị trí y tương ứng
var newY
if (type == 'success') {
    newY = value * (minDragY / 50);
} else {
    newY = 1 * (minDragY / 50);
}


// Cập nhật vị trí của dragger và các phần liên quan
gsap.to(dragger, {
    y: newY,
    onUpdate: onUpdate, // Gọi lại onUpdate để cập nhật các phần khác
    ease: "expo.inOut",
    duration: 1.0 // Tốc độ di chuyển
});
}

truyCap();