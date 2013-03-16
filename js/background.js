
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
				var n = new Notification(ndata['title'], {
							'body': ndata['body'],
							'tag': ndata['tag']
						});
			}
		}
	},
	utils: {
		ab2str: function(buf) {
			// http://updates.html5rocks.com/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
			// FUTURE: https://code.google.com/p/stringencoding/
			//return String.fromCharCode.apply(null, new Uint16Array(buf));
			return TextDecoder('utf-8').decode(new Uint8Array(buf));
		},
		str2ab: function(str) {
			// http://updates.html5rocks.com/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
			// FUTURE: https://code.google.com/p/stringencoding/
			// var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
			// var bufView = new Uint16Array(buf);
			// for (var i=0, strLen=str.length; i<strLen; i++) {
			// 	bufView[i] = str.charCodeAt(i);
			// }
			// return buf;

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

			if(items[0] == notify.settings.header_tag) {
				out['title'] = items[1];
				out['body'] = items[2];
				out['tag'] = items[3];
			}
			console.log(out);

			return out;
		},
		munge: function(str, key) {
			// Returns str XOR'd against key
			// Borrowed from http://snipplr.com/view/46795/

			var ord = [];
			var buf = "";

			for (z = 1; z <= 255; z++) { ord[String.fromCharCode(z)] = z; }
			for (j = z = 0; z < str.length; z++) {
				buf += String.fromCharCode(ord[str.substr(z, 1)] ^ ord[key.substr(j, 1)]);
				j = (j < key.length) ? j + 1 : 0;
			}

			return buf;
		},
		verify: function(str) {

		},
		process: function(str, dgram) {

			console.log("process");
			console.log(dgram);
			var key = notify.key.key();
			// if(key) {

			// }
			// else {
			// 	// Add listener

			// 	// Handle
			// }

			var handle = function() { console.log("handle");
				//var plainStr = notify.utils.xor(str, key);
				//var ndata = notify.utils.parse(plainStr);

				var ndata = notify.utils.parse(str);
				console.log("ndata");
				console.log(ndata);

				//if(!ndata['verified']) { return; }  // Abort if it's not a verified Notify message

				var highPort = notify.port.high();

				var notifyHigh = function(socketId) {
					var n = new Notification("High port open", {
						'body': highPort
					});

					// Send notice about the high port
					//var highXor = notify.utils.xor(highPort.toString(), notify.key.key());
					var highXor = notify.settings.header_tag + "|" + highPort.toString();
					console.log(highXor);
					highXor = notify.utils.str2ab(highXor);

					notify.socket.send(notify.socket.list['main'], highXor.buffer, dgram.address, dgram.port, function(data) { console.log("send cb"); console.log(data); });
				}

				// Is this a handshake?
				if(ndata['title'] == notify.settings.handshake_tag) { console.log("HELLO");


					if("high" in notify.socket.list) {
						notifyHigh(notify.socket.list["high"]);
					}
					else {
						notify.socket.open("high", highPort, function(socketId) {
							notifyHigh(socketId);
						});
					}
				}

				// Not a handshake packet
				else {  console.log("NO HELLO");
					// Pop the notification
					var n = new Notification(ndata['title'], {
						'body': (ndata['body']) ? ndata['body'] : '',
						'tag': (ndata['tag']) ? ndata['tag'] : ''
					});
				}
			};

			handle();
		}
	},
	key: {
		PWD_KEY: "pwd",
		__key: null,
		retrieve: function() {
			// Retrieve the user's password from chrome.storage
			chrome.storage.sync.get(notify.key.PWD_KEY, function(p) {
				if(notify.key.PWD_KEY in p) {
					notify.key.__key = p[notify.key.PWD_KEY];

					// Fire an event
					var evt = new CustomEvent('$keyRetrieved', false, false, notify.key.__key);
					window.dispatchEvent(evt);
				}
			});
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
			//console.log(chrome);
			// chrome.socket.create('udp', '127.0.0.1', 9000, { onEvent: notify.socket.onData },
   //              function(socketInfo) {
   //              	var socketId = socketInfo.socketId;
   //              	chrome.socket.connect(socketId, function(result) {
   //              		console.log("connected!");
   //              		var notification = webkitNotifications.createNotification("",
   //              			"Notify", "Socket open");
   //              		notification.show();
   //              	});
			// });

			// USEFUL: Chrome socket api error list:
			// https://code.google.com/p/chromium/codesearch#chromium/src/net/base/net_error_list.h

			var port = port || notify.settings.default_port;  // Set the default port number

			console.log("port: " + port);

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

						console.log("connected!  " + result);
						var notification = webkitNotifications.createNotification("",
							"Notify", "Socket open");
						notification.show();

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

			// Convert to string
			var str = notify.utils.ab2str(d.data);

			// Process
			notify.utils.process(str, d);

			//var ndata = notify.utils.parse(str);

			// var n = new Notification(ndata['title'], {
			// 	'body': (ndata['body']) ? ndata['body'] : '',
			// 	'tag': (ndata['tag']) ? ndata['tag'] : ''
			// });

			// var notification = webkitNotifications.createNotification('icon_32.png', 'Data received', str);
			// notification.show();
		}
	}
};

chrome.app.runtime.onLaunched.addListener(function() {
	// chrome.app.tabs.getCurrent(function(tab) {
	// 	var tabId = tab.id;
	// 	chrome.app.window.create('main.html', {
	// 		"type": "normal",
	// 		"tabId": tabId
	// 	});
	// });

	chrome.app.window.create('main.html', {
		id: "notify_main",
		singleton: true
	});

});

// chrome.app.runtime.onRestarted.addListener(function() {
// 	notify.socket.list.forEach(function(s) {
// 		chrome.socket.destroy(s);
// 	});
// });

notify.socket.open("main");
notify.key.retrieve();  // Retrieve the password
