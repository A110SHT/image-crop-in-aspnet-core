$(document).ready(function () {
     function b64toBlob (b64Data, contentType, sliceSize) {
        contentType = contentType || '';
        sliceSize = sliceSize || 512;
        var byteCharacters = atob(b64Data);
        var byteArrays = [];
        for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            var slice = byteCharacters.slice(offset, offset + sliceSize);
            var byteNumbers = new Array(slice.length);
            for (var i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }
            var byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }
        var blob = new Blob(byteArrays, { type: contentType }, { fileName: "ppp.JPG" });
        return blob;
    }
     function FileUploader (fileUpload) {
        $("#submit").attr('disabled', true);
        var fileformat;
        var imageonly = fileUpload.split(';');
        var contenttype = imageonly[0].split(':')[1];
        fileformat = contenttype.split('/')[1];
        var realdata = imageonly[1].split(',')[1];
        var blob = b64toBlob(realdata, contenttype);
        var filename = "pic." + fileformat;
        var data = new FormData();
        data.append("UploadLocation", "\\Images\\UserPhoto\\"); ///location
        data.append("FileInitials", "userprofile"); ///create files name with start
        data.append(filename, blob, filename);
        $.ajax({
            type: "POST",
            url: `${location.protocol}//${window.location.host}/home/UploadFilesWihtLocation`,
            contentType: false,
            processData: false,
            data: data,
            success: function (path) {
                $("#myprofilecrop").modal('hide');
                path = path.toString();
                $(".img").attr('src', path);
                alert(path);
            }
        });
    }
    var crop_max_width = 400;
    var crop_max_height = 400;
    var jcrop_api;
    var canvas;
    var context;
    var image;
    var prefsize;
    function loadImage(input) {
        var isImage = input.value;
        isImage = isImage.split('.');
        isImage = isImage[isImage.length - 1];
        if (isImage === 'png' || isImage === 'jpg' || isImage === 'jpeg') {
            if (input.files && input.files[0]) {
                var reader = new FileReader();
                canvas = null;
                reader.onload = function (e) {
                    image = new Image();
                    image.onload = validateImage;
                    image.src = e.target.result;
                };
                reader.readAsDataURL(input.files[0]);
                $("#loader").addClass("hide");
            }
        }
        else {
            alert("something wrong.");
        }
    }
    function validateImage() {
        if (canvas != null) {
            image = new Image();
            image.onload = restartJcrop;
            image.src = canvas.toDataURL('image/png');
        } else restartJcrop();
    }
    function restartJcrop() {
        if (jcrop_api != null) {
            jcrop_api.destroy();
        }
        $("#views").empty();
        $("#views").append("<canvas id=\"canvas\">");
        canvas = $("#canvas")[0];
        context = canvas.getContext("2d");
        canvas.width = image.width;
        canvas.height = image.height;
        context.drawImage(image, 0, 0);
        $("#canvas").Jcrop({
            onSelect: selectcanvas,
            onRelease: clearcanvas,
            boxWidth: crop_max_width,
            boxHeight: crop_max_height
        }, function () {
            jcrop_api = this;
        });
        clearcanvas();
    }
    function clearcanvas() {
        prefsize = {
            x: 0,
            y: 0,
            w: canvas.width,
            h: canvas.height
        };
        selectcanvas(null);
    }
    function selectcanvas(coords) {
        if (coords != null) {
            prefsize = {
                x: Math.round(coords.x),
                y: Math.round(coords.y),
                w: Math.round(coords.w),
                h: Math.round(coords.h)
            };
        }
        else {
            jcrop_api.focus();
            jcrop_api.animateTo([50, 50, 100, 100]);
            jcrop_api.setOptions({
                minSize: [150, 150],
                aspectRatio: 4 / 4
            });
            jcrop_api.focus();
            $('#canvas').Jcrop({
            }, function () {
                jcrop_api = this;
                jcrop_api.animateTo([50, 50, 100, 100]);
                // Setup and dipslay the interface for "enabled"
                $('#can_click,#can_move,#can_size').attr('checked', 'checked');
                $('#ar_lock,#size_lock,#bg_swap').attr('checked', false);
                $('.requiresjcrop').show();
            });
        }
    }
    function applyCrop() {
        canvas.width = prefsize.w;
        canvas.height = prefsize.h;
        context.drawImage(image, prefsize.x, prefsize.y, prefsize.w, prefsize.h, 0, 0, canvas.width, canvas.height);
        validateImage();
    }
    function applyScale(scale) {
        if (scale == 1) return;
        canvas.width = canvas.width * scale;
        canvas.height = canvas.height * scale;
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        validateImage();
    }
    function applyRotate() {
        canvas.width = image.height;
        canvas.height = image.width;
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.translate(image.height / 2, image.width / 2);
        context.rotate(Math.PI / 2);
        context.drawImage(image, -image.width / 2, -image.height / 2);
        validateImage();
    }
    function applyHflip() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.translate(image.width, 0);
        context.scale(-1, 1);
        context.drawImage(image, 0, 0);
        validateImage();
    }
    function applyVflip() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.translate(0, image.height);
        context.scale(1, -1);
        context.drawImage(image, 0, 0);
        validateImage();
    }
    $(".img").change(function () {
        $("#myprofilecrop").modal('show');
        loadImage(this);
    });
    $("#cropbutton").click(function (e) {
        applyCrop();
        $("#submit").attr('disabled', false);
    });
    $("#scalebutton").click(function (e) {
        var scale = prompt("Scale Factor:", "1");
        applyScale(scale);
    });
    $("#rotatebutton").click(function (e) {
        applyRotate();
    });
    $("#hflipbutton").click(function (e) {
        applyHflip();
    });
    $("#vflipbutton").click(function (e) {
        applyVflip();
    });
    $("#formimg").submit(function (e) {
        e.preventDefault();
        FileUploader(canvas.toDataURL('image/png'));
    });
});