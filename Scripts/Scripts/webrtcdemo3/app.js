var output_console = document.getElementById('output_console'),
    output_message = document.getElementById('output_message'),
    output_video = document.getElementById('output_video'),

    //socketio_address = document.getElementById('socket.io_address'),
    //option_width = document.getElementById('option_width'),
    //option_height = document.getElementById('option_height'),
    //option_framerate = document.getElementById('option_framerate'),
    //option_bitrate =   document.getElementById('option_bitrate'),
   // button_start = document.getElementById('button_start'),
    height = 230; // parseInt(option_height.value),
    width = 230; // parseInt(option_width.value),
    framerate = 15; // parseInt(option_framerate.value),
    audiobitrate = 22050; // 44100; 11025 parseInt(option_bitrate.value),
    //url=option_url.value='rtmp://'+location.host.split(':')[0]+':1935/live/test0';
    url = "rtmp://broadcast.api.video/s/1b6b9c40-4b25-4e9b-9e32-8f4b4e651d31";

console.log("framerate", framerate);
//option_height.onchange = option_height.onkeyup = function () { height = 1 * this.value; }
//option_width.onchange = option_width.onkeyup = function () { width = 1 * this.value; console.log("width" + width); }
//option_framerate.onchange = option_framerate.onkeyup = function () { framerate = 1 * this.value; console.log("framerate" + framerate); }
//option_bitrate.onchange = option_bitrate.onkeyup = function () { audiobitrate = 1 * this.value; console.log("bitrate" + audiobitrate); }
//option_url.onchange = option_url.onkeyup = function () { url = this.value; }
//button_start.onclick = requestMedia;
//button_stop.onclick = stopStream;
//button_server.onclick = connect_server;
var oo = document.getElementById("checkbox_Reconection");
//just start the server
//connect_server;
var mediaRecorder;
var socket;
var state = "stop";
console.log("state initiated = " + state);
var t;
//button_start.disabled = true;
//button_stop.disabled = true;










var videoElement = document.querySelector('.video.mine');
var audioSelect = document.querySelector('select#audioSource');
var videoSelect = document.querySelector('select#videoSource');
var _mediaStream;
audioSelect.onchange = getStream;
videoSelect.onchange = getStream;

//getStream().then(getDevices).then(gotDevices);

function getDevices() {
    // AFAICT in Safari this only gets default devices until gUM is called :/
    return navigator.mediaDevices.enumerateDevices();
}

function gotDevices(deviceInfos) {
    window.deviceInfos = deviceInfos; // make available to console
    console.log('Available input and output devices:', deviceInfos);
    for (const deviceInfo of deviceInfos) {
        const option = document.createElement('option');
        option.value = deviceInfo.deviceId;
        if (deviceInfo.kind === 'audioinput') {
            option.text = deviceInfo.label || `Microphone ${audioSelect.length + 1}`;
            audioSelect.appendChild(option);
        } else if (deviceInfo.kind === 'videoinput') {
            option.text = deviceInfo.label || `Camera ${videoSelect.length + 1}`;
            videoSelect.appendChild(option);
        }
    }
}

function getStream() {
    if (window.stream) {
        window.stream.getTracks().forEach(track => {
            track.stop();
        });
    }
    const audioSource = audioSelect.value;
    const videoSource = videoSelect.value;
    const constraints = {
        audio: { deviceId: audioSource ? { exact: audioSource } : undefined },
        video: { deviceId: videoSource ? { exact: videoSource } : undefined }
    };
    return navigator.mediaDevices.getUserMedia(constraints).
        then(gotStream).catch(handleError);
}

function gotStream(stream) {
    _mediaStream = stream;
    //  window.stream = stream; // make stream available to console
    audioSelect.selectedIndex = [...audioSelect.options].
        findIndex(option => option.text === stream.getAudioTracks()[0].label);
    videoSelect.selectedIndex = [...videoSelect.options].
        findIndex(option => option.text === stream.getVideoTracks()[0].label);
    videoElement.srcObject = stream;
}

function handleError(error) {
    console.error('Error: ', error);
}


var imageAddr = "https://stream.sup-ect.ir/img/test.jpg";
var downloadSize = 3788800; //bytes
var Result = 0;
function ShowProgressMessage(msg) {
    if (console) {
        if (typeof msg == "string") {
            console.log(msg);
        } else {
            for (var i = 0; i < msg.length; i++) {
                console.log(msg[i]);
            }
        }
    }
    var oProgress = document.getElementById("progress");
    if (oProgress) {
        var actualHTML = (typeof msg == "string") ? msg : msg.join("<br />");
        oProgress.innerHTML = actualHTML;
    }
}
function InitiateSpeedDetection() {
    ShowProgressMessage("Loading the image, please wait...");
    window.setTimeout(MeasureConnectionSpeed, 1);
};
if (window.addEventListener) {
    window.addEventListener('load', InitiateSpeedDetection, false);
} else if (window.attachEvent) {
    window.attachEvent('onload', InitiateSpeedDetection);
}
function MeasureConnectionSpeed() {
    var startTime, endTime;
    var download = new Image();
    download.onload = function () {
        endTime = (new Date()).getTime();
        showResults();
    }
    download.onerror = function (err, msg) {
        ShowProgressMessage("Invalid image, or error downloading");
    }
    startTime = (new Date()).getTime();
    var cacheBuster = "?nnn=" + startTime;
    download.src = imageAddr + cacheBuster;
    function showResults() {
        var duration = (endTime - startTime) / 1000;
        var bitsLoaded = downloadSize * 8;
        var speedBps = (bitsLoaded / duration).toFixed(2);
        var speedKbps = (speedBps / 1024).toFixed(0);
        Result = speedKbps;
        // var speedMbps = (speedKbps / 1024).toFixed(2);

    }
}





let silence = () => {
    let ctx = new AudioContext(), oscillator = ctx.createOscillator();
    let dst = oscillator.connect(ctx.createMediaStreamDestination());
    oscillator.start();
    return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
}

let black = ({ width = 640, height = 480 } = {}) => {
    let canvas = Object.assign(document.createElement("canvas"), { width, height });
    canvas.getContext('2d').fillRect(0, 0, width, height);
    let stream = canvas.captureStream();
    return Object.assign(stream.getVideoTracks()[0], { enabled: false });
}

//let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
let blackSilence = (...args) => new MediaStream([black(...args), silence()]);

var WebRtcDemo = WebRtcDemo || {};

// todo:
//  cleanup: proper module loading
//  cleanup: promises to clear up some of the async chaining
//  feature: multiple chat partners

WebRtcDemo.App = (function (viewModel, connectionManager) {
    var _hub,
        STes = [],
        _screenStream,
        _finalStream,
        _geustStream,
        _geustStream2,
        _hasStream = 'true',
        _guestConnectionID,
        _IAMDone,

        _connect = function (username, onSuccess, onFailure) {
            // Set Up SignalR Signaler

            var hub = $.connection.chatHub;
            hub.client.SetDefaultStream = function (index) {

            };
            hub.client.setMessage = function (message, connectionID, name) {
                if (connectionID == viewModel.MyConnectionId()) {
                    var ul = $(".messages ul");
                    const li = document.createElement('li');
                    li.className = 'sent';
                    li.innerHTML = `<p>` + name + ": " + message + `</p> `;
                    // var li = ' <li class="sent"> < img src = "http://emilcarlsson.se/assets/mikeross.png" alt = "" /> </li >';
                    ul.append(li);

                }
                else {
                    var ul = $(".messages ul");
                    const li = document.createElement('li');
                    li.className = 'replies';
                    li.innerHTML = `<p>` + name + ": " + message + `</p> `;
                    // var li = ' <li class="sent"> < img src = "http://emilcarlsson.se/assets/mikeross.png" alt = "" /> </li >';
                    ul.append(li);


                }
            };
            hub.client.callEveryOne = function (connectionID) {
                console.log("i am called");
                console.log(Result);

                hub.server.resPonseToCallEveryOne(connectionID);
                console.log("i have stream are you ready")
               
            };
            hub.client.areYouStillThere = function (responser) {
                if (_IAMDone != true) {
                    _IAMDone = true;
                    console.log(responser);
                    alertify.success("i am waiting please send stream");
                    hub.server.streamRequest(responser);

                }
            };
            hub.client.updateUserList = function (userList) {

                viewModel.setUsers(userList);
            };
            hub.client.GetStreamRequest = function (connectionId, reason) {
                _RequestedStream = 'blank';
                _hub.server.callUser(connectionId, "");
                alertify.success(reason);
            };
            // Hub Callback: Incoming Call
            hub.client.incomingCall = function (callingUser) {
                console.log('تماس ورودی از طرف: ' + JSON.stringify(callingUser));

                hub.server.answerCall(true, callingUser.ConnectionId);
                viewModel.Mode('incall');

                //// Ask if we want to talk
                //alertify.confirm(callingUser.Username + ' منتظر شماست، آیا به گفتمان می پیوندید ؟', function (e) {
                //    if (e) {
                //        // I want to chat
                //        hub.server.answerCall(true, callingUser.ConnectionId);

                //        // So lets go into call mode on the UI
                //        viewModel.Mode('incall');
                //    } else {
                //        // Go away, I don't want to chat with you
                //        hub.server.answerCall(false, callingUser.ConnectionId);
                //    }
                //});
            };

            // Hub Callback: Call Accepted
            hub.client.callAccepted = function (acceptingUser) {

                console.log('پذیرفته شدن تماس از طرف : ' + JSON.stringify(acceptingUser) + '.  ');
               
                _geustStream = "1";
                connectionManager.sendSignal(acceptingUser.ConnectionId, _RequestedStream);
                viewModel.guestConnectionId(acceptingUser.ConnectionId);
                connectionManager.initiateOffer(acceptingUser.ConnectionId, STes, "1");
                //connectionManager.initiateOffer(acceptingUser.ConnectionId, _mediaStream);

                // Set UI into call mode
                viewModel.Mode('incall');
            };

            // Hub Callback: Call Declined
            hub.client.callDeclined = function (decliningConnectionId, reason) {
                console.log('رد تماس از طرف: ' + decliningConnectionId);

                // Let the user know that the callee declined to talk 32478b2379023b923
                alertify.error(reason);

                // Back to an idle UI
                viewModel.Mode('idle');
            };

            // Hub Callback: Call Ended
            hub.client.callEnded = function (connectionId, reason) {
                console.log('تماس با ' + connectionId + ' پایان یافت: ' + reason);

                // Let the user know why the server says the call is over
                //الرت نمیده
                // alertify.error(reason);

                // Close the WebRTC connection
                connectionManager.closeConnection(connectionId);
                //_geustStream = null;
                $(".hangup").css("display", "none");
                // Set the UI back into idle mode
                viewModel.Mode('idle');
            };

            // Hub Callback: Update User List
            hub.client.changeStream = function (stream, acceptingUser) {
                console.log(stream);
                console.log(acceptingUser.ConnectionId);

                if (stream == 'video') {
                    connectionManager.changeTrack([_mediaStream], acceptingUser.ConnectionId);
                }
                else if (stream == 'blank') {
                    connectionManager.changeTrack([blackSilence()], acceptingUser.ConnectionId);
                }

                ////روش دوم
                //if (stream == 'video') {
                //    console.log('video');
                //    _finalStream = _mediaStream;
                //    connectionManager.changeTrack([_screenStream], id);
                //}
                //else if (stream == 'screen') {
                //    console.log('screen');
                //    if (_screenStream == null) {
                //        _finalStream = _mediaStream;
                //        connectionManager.changeTrack([_screenStream], id);

                //    } else {
                //        _finalStream = _screenStream;
                //        connectionManager.changeTrack([_screenStream], id);

                //    }
                //}
                //else {
                //    console.log('blank');
                //    connectionManager.changeTrack([_screenStream], id);

                //}



                // روش اول
                //if (stream == 'video') {
                //    console.log('video');
                //    _finalStream = _mediaStream;
                //}
                //else if (stream == 'screen') {
                //    console.log('screen');
                //    if (_screenStream == null) {
                //        _finalStream = _mediaStream;

                //    } else {
                //        _finalStream = _screenStream;

                //    }
                //}
                //else {
                //    console.log('blank');
                //    _finalStream = blackSilence();
                //}

            };

            // Hub Callback: WebRTC Signal Received
            hub.client.receiveSignal = function (callingUser, data) {

                connectionManager.newSignal(callingUser.ConnectionId, data);
            };
            $.support.cors = true;
            $.connection.hub.url = '/signalr/hubs';
            $.connection.hub.start()
                .done(function () {
                    //alert('connected to SignalR hub... connection id: ' + _hub.connection.id);

                    // Tell the hub what our username is
                    console.log(viewModel.Groupname());
                    console.log(username);
                    hub.server.join(viewModel.Groupname(), username, 'client');
                    $("#chatname").text(username)
                    if (onSuccess) {
                        onSuccess(hub);
                    }
                })
                .fail(function (event) {

                    if (onFailure) {
                        onFailure(event);
                    }
                });


            // Setup client SignalR operations
            _setupHubCallbacks(hub);
           
            _hub = hub;
        },


        _start = function (hub, type) {
            console.log("start-" + type);
            // Show warning if WebRTC support is not detected
            if (webrtcDetectedBrowser == null) {
                console.log('مرورگر خود را به روزرسانی کنید');
                $('.browser-warning').show();
            }

            // Then proceed to the next step, gathering username
            _getUsername(type);
        },

        _connect_server = function connect_server() {
            navigator.getUserMedia = (navigator.mediaDevices.getUserMedia ||
                navigator.mediaDevices.mozGetUserMedia ||
                navigator.mediaDevices.msGetUserMedia ||
                navigator.mediaDevices.webkitGetUserMedia);
            if (!navigator.getUserMedia) { fail('No getUserMedia() available.'); }
            if (!MediaRecorder) { fail('No MediaRecorder available.'); }
            console.log("connecting to socket");
            var socketio_address = 'http://localhost:1437/'; // 'http://localhost:1437';
            var socketOptions = { secure: true, reconnection: true, reconnectionDelay: 1000, timeout: 15000, pingTimeout: 15000, pingInterval: 45000, query: { framespersecond: 15, audioBitrate: 22050 } };

            //start socket connection
            socket = io.connect("http://localhost:1437", socketOptions);
            // console.log("ping interval =", socket.pingInterval, " ping TimeOut" = socket.pingTimeout);
            //output_message.innerHTML=socket;

            socket.on('connect_timeout', (timeout) => {
                console.log("state on connection timeout= " + timeout);
                output_message.innerHTML = "Connection timed out";
                recordingCircle.style.fill = 'gray';

            });
            socket.on('error', (error) => {
                console.log("state on connection error= " + error);
                //output_message.innerHTML = "Connection error";
                //recordingCircle.style.fill = 'gray';
            });

            socket.on('connect_error', function () {
                console.log("state on connection error= " + state);
                output_message.innerHTML = "Connection Failed";
                recordingCircle.style.fill = 'gray';
            });

            socket.on('message', function (m) {
                console.log("state on message= " + state);
                console.log('recv server message', m);
                _show_output('SERVER:' + m);

            });

            socket.on('fatal', function (m) {

                _show_output('Fatal ERROR: unexpected:' + m);
                //alert('Error:'+m);
                console.log("fatal socket error!!", m);
                console.log("state on fatal error= " + state);
                //already stopped and inactive
                console.log('media recorder restarted');
                recordingCircle.style.fill = 'gray';

                //mediaRecorder.start();
                //state="stop";
                //button_start.disabled=true;
                //button_server.disabled=false;
                //document.getElementById('button_start').disabled=true;　
                //restart the server

                if (oo.checked) {
                    //timedCount();
                    output_message.innerHTML = "server is reload!";
                    console.log("server is reloading!");
                    recordingCircle.style.fill = 'gray';
                }
                //should reload?
            });

            socket.on('ffmpeg_stderr', function (m) {
                //this is the ffmpeg output for each frame
                _show_output('FFMPEG:' + m);
            });

            socket.on('disconnect', function (reason) {
                console.log("state disconec= " + state);
                _show_output('ERROR: server disconnected!');
                console.log('ERROR: server disconnected!' + reason);
                recordingCircle.style.fill = 'gray';
                //reconnect the server
              //  _connect_server();

                //socket.open();
                //mediaRecorder.stop();
                //state="stop";
                //button_start.disabled=true;
                //button_server.disabled=false;
                //	document.getElementById('button_start').disabled=true;　
                //var oo=document.getElementById("checkbox_Reconection");
                if (oo.checked) {
                    //timedCount();
                    output_message.innerHTML = "server is reloading!";
                    console.log("server is reloading!");
                }
            });

            state = "ready";
            console.log("state = " + state);
            //button_start.disabled = false;
            //button_stop.disabled = false;
            //button_server.disabled = true;
            //output_message.innerHTML = "connect server successful";
           // alert("connect server successful");
            _requestMedia();
        },
        _stopStream =  function stopStream() {
            console.log("stop pressed:");
            //stream.getTracks().forEach(track => track.stop())
            mediaRecorder.stop();
            recordingCircle.style.fill = 'gray';
            //button_stop.disabled = true;
            //button_start.disabled = true;
            //button_server.disabled = false;
        },
        _requestMedia = function requestMedia() {

           // _video_show(STes[0]);//only show locally, not remotely
            recordingCircle.style.fill = 'red';
            socket.emit('config_rtmpDestination', url);
            socket.emit('start', 'start');
            var remotestream = new MediaStream();
            remotestream = STes[0];
            var mediaRecorder = new MediaStreamRecorder(_mediaStream);
           // mediaRecorder = new MediaRecorder(remotestream);
            mediaRecorder.start(250);
            //button_stop.disabled = false;
            //button_start.disabled = true;
            //button_server.disabled = true;

            //show remote stream
            //var livestream = document.getElementsByClassName("Livestream");
            //console.log("adding live stream");
            //livestream.innerHtml = "test";

            mediaRecorder.onstop = function (e) {
                console.log("stopped!");
                console.log(e);
               // stream.stop();

            }

            mediaRecorder.onpause = function (e) {
                console.log("media recorder paused!!");
                console.log(e);
               // stream.stop();

            }

            mediaRecorder.onerror = function (event) {
                let error = event.error;
                console.log("error", error.name);

            };
           // document.getElementById('button_start').disabled = false;

            mediaRecorder.ondataavailable = function (e) {

                socket.emit("binarystream", e.data);
                state = "start";
               // chunks.push(e.data);
            }



           // var constraints = {
           //     audio: {
           //         sampleRate: audiobitrate,
           //         echoCancellation: true
           //     },
           //     video: {
           //         width: { min: 100, ideal: width, max: 1920 },
           //         height: { min: 100, ideal: height, max: 1080 },
           //         frameRate: { ideal: framerate }
           //     }
           // };
           //// console.log(constraints);
           // navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
           // _video_show(stream);//only show locally, not remotely

           // recordingCircle.style.fill = 'red';
           // socket.emit('config_rtmpDestination', url);
           //     socket.emit('start', 'start');

           // mediaRecorder = new MediaRecorder(stream);
           // mediaRecorder.start(250);
           // //button_stop.disabled = false;
           // //button_start.disabled = true;
           // //button_server.disabled = true;

           // //show remote stream
           // //var livestream = document.getElementsByClassName("Livestream");
           // //console.log("adding live stream");
           // //livestream.innerHtml = "test";

           // mediaRecorder.onstop = function (e) {
           //     console.log("stopped!");
           //     console.log(e);
           //     stream.stop();

           // }

           // mediaRecorder.onpause = function (e) {
           //     console.log("media recorder paused!!");
           //     console.log(e);
           //     stream.stop();

           // }

           // mediaRecorder.onerror = function (event) {
           //     let error = event.error;
           //     console.log("error", error.name);

           // };
           // //document.getElementById('button_start').disabled=false;　

           // mediaRecorder.ondataavailable = function (e) {

           //     socket.emit("binarystream", e.data);
           //     state = "start";
           //     //chunks.push(e.data);
           // }
           //     //let supported = navigator.mediaDevices.getSupportedConstraints();
           //     //console.log(supported);
                
           // }).catch(function (err) {
           //     console.log('The following error occured: ' + err);
           //     _show_output('Local getUserMedia ERROR:' + err);
           //     output_message.innerHTML = "Local video source size is not support or No camera ?" + output_video.videoWidth + "x" + output_video.videoHeight;
           //     state = "stop";
           //    // button_start.disabled = true;
           //     //button_server.disabled = false;
           // });
        },
        _video_show = function video_show(stream) {
            if ("srcObject" in output_video) {
                output_video.muted = true;
                output_video.srcObject = stream;
            } else {
                output_video.src = window.URL.createObjectURL(stream);
            }
            output_video.addEventListener("loadedmetadata", function (e) {
                //console.log(output_video);
                output_message.innerHTML = "Local video source size:" + output_video.videoWidth + "x" + output_video.videoHeight;
            }, false);
        },
        _show_output = function show_output(str) {
            output_console.value += "\n" + str;
            output_console.scrollTop = output_console.scrollHeight;
        },


        _getUsername = function (type) {
            console.log("getusername-" + type);
            _startSession('relay');
            //alertify.prompt(" نام شما ؟", function (e, username) {
            //    if (e == false || username == '') {
            //        //username = 'کاربر ' + Math.floor((Math.random() * 10000) + 1);
            //        alertify.success('جهت اتصال باید نام کلاس را وارد کنید');
            //    }
            //    else {
                    
            //    }

            //    // proceed to next step, get media access and start up our connection

            //}, '');
        },

        _startSession = function (username) {

            // Set the selected username in the UI
            viewModel.Username(username);
            viewModel.Loading(true); // Turn on the loading indicator
            $('.instructions').hide();
            var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            //if (!isMobile) {

            //    navigator.mediaDevices.getDisplayMedia({
            //        video: {
            //            cursor: "always"
            //        },
            //        audio: true
            //    }).then(

            //        stream => {
            //            console.log("screen is awesom");
            //            var videoScreen = document.querySelector('.video.screen');
            //            _screenStream = stream;


            //           // attachMediaStream(videoScreen, _screenStream);

            //        },
            //        error => {
            //            console.log("Unable to acquire screen capture", error);
            //            viewModel.Loading(false);
            //        });

            //}
            //else {
            //    $('.video.screen').css("display", "none");
            //};


            //getUserMedia(
            //    {
            //        // Permissions to request
            //        video: {
            //            facingMode: "environment",

            //        },
            //        audio: true,
            //    },
            //    function (stream) { // succcess callback gives us a media stream

            //        //var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            //        //if (!isMobile) {
            //        //     var audioTrack = stream.getAudioTracks()[0];
            //        //     _screenStream.addTrack(audioTrack);
            //        //}

            //        $('.instructions').hide();
            //        _mediaStream = stream;
            //        _finalStream = stream;
            //        var videoElement = document.querySelector('.video.mine');
            //        attachMediaStream(videoElement, stream);
            //        $(".audio.mine").css("display", "none");


            //        //blackSilence());//

            //        viewModel.Loading(false);
            //    },
            //    function (error) { // error callback
            //        alertify.alert('<h4>Failed to get hardware access!</h4> Do you have another browser type open and using your cam/mic?<br/><br/>You were not connected to the server, because I didn\'t code to make browsers without media access work well. <br/><br/>Actual Error: ' + JSON.stringify(error));
            //        viewModel.Loading(false);
            //    }
            //);
            $('.instructions').hide();
            _finalStream = _mediaStream;
            //var videoElement = document.querySelector('.video.mine');
            //attachMediaStream(videoElement, stream);
            $(".audio.mine").css("display", "none");
            $(".mineholder").css("display", "inline-block");



            // Now we have everything we need for interaction, so fire up SignalR
            _connect(username, function (hub) {
                // tell the viewmodel our conn id, so we can be treated like the special person we are.
                viewModel.MyConnectionId(hub.connection.id);

                // Initialize our client signal manager, giving it a signaler (the SignalR hub) and some callbacks
                // alert('initializing connection manager');
                connectionManager.initialize(hub.server, _callbacks.onReadyForStream, _callbacks.onStreamAdded, _callbacks.onStreamRemoved, _callbacks.onTrackAdded);

                // Store off the stream reference so we can share it later
                // _mediaStream = stream;

                // Load the stream into a video element so it starts playing in the UI
                console.log('playing my local video feed');

                // Hook up the UI
                _attachUiHandlers();
                viewModel.Loading(false);

                 console.log("before Connecting");
                _connect_server();

                //_IAMDone = "";
                //_geustStream = "0";
                //hub.server.hangUp("");
                //connectionManager.closeAllConnections(viewModel.guestConnectionId());
                //hub.server.callEveryOne(viewModel.guestConnectionId());

               

            }, function (event) {
                alertify.alert('<h4>Failed SignalR Connection</h4> We were not able to connect you to the signaling server.<br/><br/>Error: ' + JSON.stringify(event));
                viewModel.Loading(false);
            });
            // Ask the user for permissions to access the webcam and mic
            //getUserMedia(
            //    {
            //        // Permissions to request
            //        video: true,
            //        audio: true,
            //    },
            //    function (stream) { // succcess callback gives us a media stream

            //    },
            //    function (error) { // error callback
            //        alertify.alert('<h4>Failed to get hardware access!</h4> Do you have another browser type open and using your cam/mic?<br/><br/>You were not connected to the server, because I didn\'t code to make browsers without media access work well. <br/><br/>Actual Error: ' + JSON.stringify(error));
            //        viewModel.Loading(false);
            //    }
            //);
        },

        _attachUiHandlers = function () {
            $(".mycamera").click(function () {
                var x = document.getElementById("cameraSection");
                if (x.style.display === "none") {
                    $("#cameraSection").slideDown();
                    // x.style.display = "block";
                } else {
                    $("#cameraSection").slideUp();
                    // x.style.display = "none";
                }
            })
            $(".chat").click(function () {
                var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                if (isMobile) {
                    var width = $("#chatHolder").width();
                    if (width == 0) {
                        $(".content").css("display", "block");
                        $("#vidoeHolder").animate({
                            width: '0%'
                        });
                        $("#chatHolder").animate({
                            width: '100%'
                        })
                    }
                    else {
                        $(".content").css("display", "none");
                        $("#vidoeHolder").animate({
                            width: '100%'
                        });
                        $("#chatHolder").animate({
                            width: '0%'
                        })
                    }

                }
                else {
                    var width = $("#chatHolder").width();
                    if (width == 0) {
                        $("#vidoeHolder").animate({
                            width: '50%'
                        });
                        $("#chatHolder").animate({
                            width: '50%'
                        })
                    }
                    else {
                        $("#vidoeHolder").animate({
                            width: '100%'
                        });
                        $("#chatHolder").animate({
                            width: '0%'
                        })
                    }

                }


            });
            // Add click handler to users in the "Users" pane
            $('.user').live('click', function () {
                // Find the target user's SignalR client id
                var targetConnectionId = $(this).attr('data-cid');

                // Make sure we are in a state where we can make a call
                //if (viewModel.Mode() !== 'idle') {
                //    alertify.error('Sorry, you are already in a call.  Conferencing is not yet implemented.');
                //    return;
                //}

                // Then make sure we aren't calling ourselves.
                if (targetConnectionId != viewModel.MyConnectionId()) {
                    // Initiate a call
                    _hub.server.callUser(targetConnectionId);// 

                    // UI in calling mode
                    viewModel.Mode('calling');
                } else {
                    alertify.error("Ah, nope.  Can't call yourself.");
                }
            });

            // Add handler for the hangup button
            $('.hangup').click(function () {
                _IAMDone = "";
                _geustStream = "0";
                // Only allow hangup if we are not idle
                $(".requst").css("display", "inline-block")
                $(".hangup").css("display", "none")
                if (viewModel.Mode() != 'idle') {
                    _hub.server.hangUp("");
                    connectionManager.closeAllConnections();
                    viewModel.Mode('idle');
                }
            });
            $('.requst').click(function () {
                _IAMDone = "";
                _geustStream = "0";
                _hub.server.hangUp("");
                connectionManager.closeAllConnections(viewModel.guestConnectionId());
                _hub.server.callEveryOne(viewModel.guestConnectionId());
                alertify.success("درخواست شما ارسال شد");
            });
            $(".submit").click(function () {
                var message = $("#chatMessage").val();
                _hub.server.sendMessage(message);
            })

        },

        _setName = function (name) {
            viewModel.Groupname(name);
        },
        _setupHubCallbacks = function (hub) {


        },

        // Connection Manager Callbacks
        _callbacks = {

            onReadyForStream: function (connection) {

                // The connection manager needs our stream
                // todo: not sure I like this

                //navigator.mediaDevices.getDisplayMedia({
                //    video: {
                //        cursor: "always"
                //    },
                //    audio: true
                //}).then(
                //    stream => {
                //        console.log("awesom");
                //        _mediaStream = stream;
                //        var videoElement = document.querySelector('.video.mine');
                //        attachMediaStream(videoElement, stream);
                //        $(".audio.mine").css("display", "none");


                //    },
                //    error => {
                //        console.log("Unable to acquire screen capture", error);
                //    });

                //connection.addStream(_mediaStream); 


                var st1 = new MediaStream();
                var st2 = new MediaStream();

                // st2.getAudioTracks[0] = blackSilence().getAudioTracks[0];
                // st2.getAudioTracks[0] = _mediaStream.getAudioTracks[0];

                //st2.getVideoTracks[0] = blackSilence().getVideoTracks[0];
                // st2.getVideoTracks[0] = _mediaStream.getVideoTracks[0];

                //let STES = [_mediaStream, blackSilence()];
                //for (const stream of STES) {

                //};
                blackSilence().getTracks().forEach(function (track) {

                    connection.addTrack(track, st1);
                });
                console.log("adding media stream");
                //connection.addStream(_finalStream);


            },
            onStreamAdded: function (connection, event) {
                console.log('binding remote stream to the partner window');

                // Bind the remote stream to the partner window


                //var otherVideo = document.querySelector('.video.partner');

                //attachMediaStream(otherVideo, event.stream); // from adapter.js
                $(".partnerholder").css("display", "inline-block");
                $(".requst").css("display", "inline-block");
                $(".hangup").css("display", "inline-block");




            },
            onTrackAdded: function (connection, event) {

                if (_geustStream == "0") {
                    _geustStream == "1"
                    var otherVideo = document.querySelector('.video.partner');
                    var otherVideo2 = document.querySelector('.video.partner2');
                    var otherVideo3 = document.querySelector('.video.partner3');


                    var st1 = new MediaStream();
                    if (event.streams[0].getVideoTracks() != null) {
                        if (event.streams[0].getVideoTracks()[0] != null) {
                            console.log("1 has video")
                            st1.addTrack(event.streams[0].getVideoTracks()[0]);

                        }

                    }
                    if (event.streams[0].getVideoTracks() != null) {
                        if (event.streams[0].getAudioTracks()[0] != null) {
                            console.log("1 has audio")
                            st1.addTrack(event.streams[0].getAudioTracks()[0]);
                        }
                    }
                    STes[0] = st1;
                    _connect_server();

                    var st2 = new MediaStream();
                    if (event.streams[0].getVideoTracks() != null) {
                        if (event.streams[0].getVideoTracks()[1] != null) {
                            console.log("2 has video")
                            st2.addTrack(event.streams[0].getVideoTracks()[1]);

                        }
                    }
                    if (event.streams[0].getVideoTracks() != null) {

                        if (event.streams[0].getAudioTracks()[1] != null) {
                            console.log("2 has audio")
                            st2.addTrack(event.streams[0].getAudioTracks()[1]);
                        }
                    }

                    STes[1] = st2;

                    var st3 = new MediaStream();
                    if (event.streams[0].getVideoTracks() != null) {
                        if (event.streams[0].getVideoTracks()[2] != null) {
                            console.log("3 has video")
                            st3.addTrack(event.streams[0].getVideoTracks()[2]);

                        }
                    }
                    if (event.streams[0].getVideoTracks() != null) {

                        if (event.streams[0].getAudioTracks()[2] != null) {
                            console.log("3 has audio")
                            st3.addTrack(event.streams[0].getAudioTracks()[2]);
                        }
                    }
                    STes[2] = st3;



                    attachMediaStream(otherVideo, st1);
                    attachMediaStream(otherVideo2, st2);
                    attachMediaStream(otherVideo3, st3);
                }
                

                //if (_geustStream == null) {
                //    var otherVideo = document.querySelector('.video.partner');
                //    var otherVideo2 = document.querySelector('.video.partner2');
                //    //_geustStream = event.stream;
                //    // _hasStream = "true";
                    
                //    //
                //    //attachMediaStream(otherVideo, st1);
                //    //attachMediaStream(otherVideo2, st2);
                //    console.log("ontrack fired!");

                //    //if (_guestConnectionID != null) {
                //    //    connectionManager.sendSignal(_guestConnectionID, _RequestedStream);
                //    //    connectionManager.initiateOffer(_guestConnectionID, [_geustStream, _geustStream2], "1");
                //    //}

                //}
                //else {
                //    console.log("_getstream in no null");
                //}





            },
            onStreamRemoved: function (connection, streamId) {
                // todo: proper stream removal.  right now we are only set up for one-on-one which is why this works.
                console.log('removing remote stream from partner window');

                // Clear out the partner window
                var otherVideo = document.querySelector('.video.partner');
                otherVideo.src = '';
            }
        };

    return {
        start: _start, // Starts the UI process
        getStream: function () { // Temp hack for the connection manager to reach back in here for a stream
            return _mediaStream;
        },
        setName: _setName
    };
})(WebRtcDemo.ViewModel, WebRtcDemo.ConnectionManager);

// Kick off the app
WebRtcDemo.App.start();