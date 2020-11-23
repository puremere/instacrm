﻿var WebRtcDemo = WebRtcDemo || {};

/************************************************
ConnectionManager.js

Implements WebRTC connectivity for sharing video
streams, and surfaces functionality to the rest
of the app.

WebRTC API has been normalized using 'adapter.js'

************************************************/
WebRtcDemo.ConnectionManager = (function () {
    var _signaler,
        _connections = {}, 
       // _iceServers = [{ url:  'stun:74.125.142.127:19302' }], // stun.l.google.com - Firefox does not support DNS names.
        _iceServers = [{ url: 'stun:74.125.142.127:19302' },{
            url: 'turn:numb.viagenie.ca',
            credential: 'muazkh',
            username: 'webrtc@live.com'
        }],
        /* Callbacks */
        _onReadyForStreamCallback = function () { console.log('UNIMPLEMENTED: _onReadyForStreamCallback'); },
        _onStreamAddedCallback = function () { console.log('UNIMPLEMENTED: _onStreamAddedCallback'); },
        _onStreamRemovedCallback = function () { console.log('UNIMPLEMENTED: _onStreamRemovedCallback'); },
        _onTrackAddedCallback = function () { console.log('UNIMPLEMENTED: _onTrackAddedCallback'); },

        // Initialize the ConnectionManager with a signaler and callbacks to handle events
        _initialize = function (signaler, onReadyForStream, onStreamAdded, onStreamRemoved, onTrackAdded) {
            _signaler = signaler;

            _onReadyForStreamCallback = onReadyForStream || _onReadyForStreamCallback;
            _onStreamAddedCallback = onStreamAdded || _onStreamAddedCallback;
            _onStreamRemovedCallback = onStreamRemoved || _onStreamRemovedCallback
            _onTrackAddedCallback = onTrackAdded || _onTrackAddedCallback;
        },

        // Create a new WebRTC Peer Connection with the given partner
        _createConnection = function (partnerClientId) {
            console.log('WebRTC: creating connection...');

            // Create a new PeerConnection
            var connection = new RTCPeerConnection({ iceServers: _iceServers });

            // ICE Candidate Callback
            connection.onicecandidate = function (event) {
                if (event.candidate) {
                   
                    // Found a new candidate
                    console.log('WebRTC: new ICE candidate');
                    _signaler.sendSignal(JSON.stringify({ "candidate": event.candidate }), partnerClientId);
                } else {
                    // Null candidate means we are done collecting candidates.
                    console.log('WebRTC: ICE candidate gathering complete');
                }
            };

            // State changing
            connection.onstatechange = function () {
                // Not doing anything here, but interesting to see the state transitions
                var states = {
                    'iceConnectionState': connection.iceConnectionState,
                    'iceGatheringState': connection.iceGatheringState,
                    'readyState': connection.readyState,
                    'signalingState': connection.signalingState
                };

                console.log(JSON.stringify(states));
            };

            // Stream handlers
            connection.onaddstream = function (event) {
               
                console.log('WebRTC: adding stream');
                // A stream was added, so surface it up to our UI via callback
                _onStreamAddedCallback(connection, event);
            };

            connection.onremovestream = function (event) {
                console.log('WebRTC: removing stream');
                // A stream was removed
                _onStreamRemovedCallback(connection, event.stream.id);
            };
            connection.ontrack = function (event) {
                console.log('WebRTC: adding track');
                _onTrackAddedCallback(connection, event);

            }

            // Store away the connection
            _connections[partnerClientId] = connection;

            // And return it
            return connection;
        },

        // Process a newly received SDP signal
        _receivedSdpSignal = function (connection, partnerClientId, sdp) {
          
            console.log('WebRTC: processing sdp signal');
            connection.setRemoteDescription(new RTCSessionDescription(sdp), function () {
               
                if (connection.remoteDescription.type == "offer") {
                    console.log('WebRTC: received offer, sending response...');
                    _onReadyForStreamCallback(connection); // stream into connection
                    connection.createAnswer(function (desc) {
                            connection.setLocalDescription(desc, function () {
                                _signaler.sendSignal(JSON.stringify({ "sdp": connection.localDescription }), partnerClientId);
                            });
                    },
                    function (error) { console.log('Error creating session description: ' + error); });
                } else if (connection.remoteDescription.type == "answer") {
                    console.log('WebRTC: received answer');
                }
            });
        },

        // Hand off a new signal from the signaler to the connection
        _newSignal = function (partnerClientId, data) {
           
            var signal = JSON.parse(data),
            connection = _getConnection(partnerClientId);

            console.log('WebRTC: received signal');
            
            // Route signal based on type
            if (signal.sdp) {  // طرف تولید کرده برات فرستاده
                _receivedSdpSignal(connection, partnerClientId, signal.sdp);
            } else if (signal.candidate) {
                _receivedCandidateSignal(connection, partnerClientId, signal.candidate);
            }
        },

        // Process a newly received Candidate signal
        _receivedCandidateSignal = function (connection, partnerClientId, candidate) {
         
            console.log('WebRTC: processing candidate signal');
            connection.addIceCandidate(new RTCIceCandidate(candidate));
        },

        // Retreive an existing or new connection for a given partner
        _getConnection = function (partnerClientId) {
          
            var connection = _connections[partnerClientId] || _createConnection(partnerClientId);
            return connection;
        },

        // Close all of our connections
        _closeAllConnections = function (guestConnectionId) {
            for (var connectionId in _connections) {
                if (connectionId != guestConnectionId) {
                    _closeConnection(connectionId);
                }
                
            }
        },

        // Close the connection between myself and the given partner
        _closeConnection = function (partnerClientId) {
            var connection = _connections[partnerClientId];

            if (connection) {
                // Let the user know which streams are leaving
                // todo: foreach connection.remoteStreams -> onStreamRemoved(stream.id)
                _onStreamRemovedCallback(null, null);

                // Close the connection
                connection.close();
                delete _connections[partnerClientId]; // Remove the property
            }
        },

        // Send an offer for audio/video
        _initiateOffer = function (partnerClientId, STES) {

          
            // Get a connection for the given partner
            var connection = _getConnection(partnerClientId);

            // Add our audio/video stream
           // connection.addStream(stream);
            var st1 = new MediaStream();
            var st2 = new MediaStream();

            for (const stream of STES) {
                stream.getTracks().forEach(function (track) {

                    _sender = connection.addTrack(track, st1);
                });
            };
          
            // Send an offer for a connection
            connection.createOffer(function (desc) {
                connection.setLocalDescription(desc, function () {
                    _signaler.sendSignal(JSON.stringify({ "sdp": connection.localDescription }), partnerClientId);
                });
            }, function (error) { alert('Error creating session description: ' + error); });
        },
        _sendSignal = function (partnerClientId, signal) {


            _signaler.sendSignalForStream(signal, partnerClientId);
        },
        _changeTrack = function (STES, selectedID) {
            for (var connectionId in _connections) {
                if (connectionId == selectedID) {
                
                    
                    connection = _connections[connectionId];
                    var st1 = new MediaStream();
                    var st2 = new MediaStream();
                    for (const stream of STES) {
                        stream.getTracks().forEach(function (track) {

                            st2.addTrack(track);
                        });
                    };

                    //connection.getSenders().map(sender =>
                    //    sender.replaceTrack((sender.track.kind == "audio")? newStream.getAudioTracks()[0]: nowVideo));

                    // روش دوم
                    var i = 0;
                    var j = 0
                    for (const sender of connection.getSenders()) {
                        if (sender.track != null) {
                            if (sender.track.kind == "audio") {
                                if (st2.getAudioTracks()[i] != null) {
                                    sender.replaceTrack(st2.getAudioTracks()[i]);
                                    i += 1;
                                }

                            } else {
                                if (st2.getVideoTracks()[j] != null) {
                                    sender.replaceTrack(st2.getVideoTracks()[j]);
                                    j += 1;
                                }

                            }
                        }
                        


                    }
                    console.log("track change by client");

                    //connection = _connections[connectionId];
                    //var st1 = new MediaStream();
                    //Promise.all(pc1.getSenders().map(sender =>
                    //    sender.replaceTrack((sender.track.kind == "audio") ?
                    //        newStream.getAudioTracks()[0] :
                    //        newStream.getVideoTracks()[0])))
                    //    .then(() => log("Flip!"))
                    //    .catch(failed);


                }


            }





        }

    // Return our exposed API
    return {
        initialize: _initialize,
        newSignal: _newSignal,
        closeConnection: _closeConnection,
        closeAllConnections: _closeAllConnections,
        initiateOffer: _initiateOffer,
        changeTrack: _changeTrack,
        sendSignal: _sendSignal
    };
})();