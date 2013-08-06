
  // var notification = webkitNotifications.createNotification("",
  //     "Simple Background App",
  //     "A background window has been created");
  // notification.show();


var notify = {
	settings: {
		pwd_key: "pwd",
		default_port: 9000,
		header_tag: "NOTIFY",
		handshake_tag: "HINOTIFY"
	},
	notification: {
		show: function(ndata) {

			// Show only if there's a valid title
			if(ndata['title']) {

				chrome.notifications.create(ndata['tag'], {
					"type": "basic",
					"title": ndata['title'],
					"message": ndata['body'],
					"iconUrl": "img/notify.png"
				}, function(notificationId) {
					setTimeout(function() {
						chrome.notifications.clear(notificationId, function() {});
					}, notify.notification.duration.length * 1000);
				});
			}
		}
	},
	utils: {
		ab2str: function(buf) {
			// http://updates.html5rocks.com/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
			// https://code.google.com/p/stringencoding/

			return TextDecoder('utf-8').decode(new Uint8Array(buf));
		},
		str2ab: function(str) {
			// http://updates.html5rocks.com/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
			// https://code.google.com/p/stringencoding/

			return TextEncoder('utf-8').encode(str);
		},
		utf8_to_b64: function(str) {
			// Taken from https://developer.mozilla.org/en-US/docs/DOM/window.btoa#Unicode_Strings
			// Also http://ecmanaut.blogspot.ca/2006/07/encoding-decoding-utf8-in-javascript.html
			return window.btoa(unescape(encodeURIComponent( str )));
		},
		b64_to_utf8: function(str) {
			// Taken from https://developer.mozilla.org/en-US/docs/DOM/window.btoa#Unicode_Strings
			// Also http://ecmanaut.blogspot.ca/2006/07/encoding-decoding-utf8-in-javascript.html
			return decodeURIComponent(escape(window.atob( str )));
		},
		str_to_utf8: function(str) {
			return decodeURIComponent(escape(str));
		},
		parse: function(data) {
			// Parse string from Android client
			var out = {};
			var items = data.split("|");

			// Check only from the second field onwards
			// We discard the random salt in the first field
			if(items[1] == notify.settings.header_tag) {
				out.title = items[2];
				out.body = items[3];
				out.tag = items[4];
			}
			console.log(out);

			return out;
		},
		munge: function(str, key) {
			// Returns str XOR'd against key
			// Adapted from http://snipplr.com/view/46795/

			var ord = [];
			var buf = "";

			for(var i=0; i < str.length; ++i) {
				buf += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
			}

			return buf;
		},
		process: function(str, dgram) {

			var key = notify.key.key();

			var handle = function(str, key) {
				try {
					str = atob(str.trim()); // Base64 decode
					var plainStr = notify.utils.munge(str, key);
					plainStr = notify.utils.str_to_utf8(plainStr);
					var ndata = notify.utils.parse(plainStr);
					notify.notification.show(ndata);
				}
				catch(e) { console.log(e); /* Fail silently */ }
			};

			if(key) {
				handle(str, key);
			}
			else {
				// Add listener
				window.addEventListener('$keyRetrieved', function(key) {
					// Handle
					handler(str, key);
				});
			}

			// var handle = function() { console.log("handle");
			// 	//var plainStr = notify.utils.xor(str, key);
			// 	//var ndata = notify.utils.parse(plainStr);

			// 	var ndata = notify.utils.parse(str);
			// 	console.log("ndata");
			// 	console.log(ndata);

			// 	//if(!ndata['verified']) { return; }  // Abort if it's not a verified Notify message

			// 	var highPort = notify.port.high();

			// 	var notifyHigh = function(socketId) {
			// 		var n = new Notification("High port open", {
			// 			'body': highPort
			// 		});
7
			// 		// Send notice about the high port
			// 		//var highXor = notify.utils.xor(highPort.toString(), notify.key.key());
			// 		var highXor = notify.settings.header_tag + "|" + highPort.toString();
			// 		console.log(highXor);
			// 		highXor = notify.utils.str2ab(highXor);

			// 		notify.socket.send(notify.socket.list['main'], highXor.buffer, dgram.address, dgram.port, function(data) { console.log("send cb"); console.log(data); });
			// 	}

			// 	// Is this a handshake?
			// 	if(ndata['title'] == notify.settings.handshake_tag) { console.log("HELLO");


			// 		if("high" in notify.socket.list) {
			// 			notifyHigh(notify.socket.list["high"]);
			// 		}
			// 		else {
			// 			notify.socket.open("high", highPort, function(socketId) {
			// 				notifyHigh(socketId);
			// 			});
			// 		}
			// 	}

			// 	// Not a handshake packet
			// 	else {  console.log("NO HELLO");
			// 		// Pop the notification
			// 		var n = new Notification(ndata['title'], {
			// 			'body': (ndata['body']) ? ndata['body'] : '',
			// 			'tag': (ndata['tag']) ? ndata['tag'] : ''
			// 		});
			// 	}
			//};
		}
	},
	key: {
		__key: null,
		retrieve: function() {
			// Retrieve the user's password from chrome.storage
			chrome.storage.sync.get(notify.settings.pwd_key, function(p) {
				if(notify.settings.pwd_key in p) {
					notify.key.__key = md5(p[notify.settings.pwd_key]);

					// Fire an event
					var evt = new CustomEvent('$keyRetrieved', {'detail': notify.key.__key});
					window.dispatchEvent(evt);
				}
			});
		},
		changed: function(changed, area) {
			if(notify.settings.pwd_key in changed) {
				notify.key.__key = md5(changed[notify.settings.pwd_key].newValue);
			}
		},
		key: function() {
			// Return the key, if available
			if(notify.key.__key) {
				return notify.key.__key;
			}
			else {
				notify.key.retrieve();
			}
		}
	},
	port: {
		__high: null,
		high: function() {
			// Returns a random high port between 9001 and 10000 if one doesn't exist
			if(!notify.port.__high) {
				notify.port.__high = (Math.round(Math.random() * 10000) % 1000 ) + 9001;
			}

			return notify.port.__high;
		}
	},
	socket: {
		list: {},
		open: function(tag, port, cb) {

			// USEFUL: Chrome socket api error list:
			// https://code.google.com/p/chromium/codesearch#chromium/src/net/base/net_error_list.h

			var port = port || notify.settings.default_port;  // Set the default port number

			chrome.socket.create('udp', {}, function(socketInfo) {
				var socketId = socketInfo.socketId;
				//notify.socket.list.push(socketId);
				notify.socket.list[tag] = socketId;
				chrome.socket.bind(socketId, '0.0.0.0', port, function(result) {
					if(result) {
						console.log("bind failed - " + socketId);
						console.log(result);
					}
					else {

						// Get info on socket
						chrome.socket.getInfo(socketId, function(d) {
							console.log(socketId);
							console.log(d);
						});

						// Call the callback
						if(typeof(cb) == 'function') {
							cb(socketId);
						}

						notify.socket.receiveLoop(socketId, 512, notify.socket.onData);
					}

				});
			});

		},
		send: function(socketId, dataAb, address, port, cb) {
			chrome.socket.sendTo(socketId, dataAb, address, port, cb);
		},
		receiveLoop: function(socketId, bufSize, onData) {
			var bufSize = bufSize || 512;
			var onData = onData || notify.socket.onData;

			var loopWrapper = function(data) {
				notify.socket.onData(data);
				notify.socket.receiveLoop(socketId, bufSize, loopWrapper);
			};

			chrome.socket.recvFrom(socketId, bufSize, loopWrapper);
		},
		onData: function(d) {
			console.log(d);
			console.log(notify.utils.ab2str(d.data));

			// Process
			notify.utils.process(notify.utils.ab2str(d.data), d);
		}
	}
};

chrome.app.runtime.onLaunched.addListener(function() {

	chrome.app.window.create('main.html', {
		id: "notify_main",
		singleton: true,
		maxWidth: 640,
		maxHeight: 400
	});

});

notify.socket.open("main");
notify.key.retrieve();  // Retrieve the password

chrome.storage.onChanged.addListener(notify.key.changed);
