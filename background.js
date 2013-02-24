
  // var notification = webkitNotifications.createNotification("",
  //     "Simple Background App",
  //     "A background window has been created");
  // notification.show();


var notify = {
	utils: {
		ab2str: function(buf) {
			// http://updates.html5rocks.com/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
			// FUTURE: https://code.google.com/p/stringencoding/
			return String.fromCharCode.apply(null, new Uint8Array(buf));
		},
		str2ab: function(str) {
			// http://updates.html5rocks.com/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
			// FUTURE: https://code.google.com/p/stringencoding/
			var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
			var bufView = new Uint8Array(buf);
			for (var i=0, strLen=str.length; i<strLen; i++) {
				bufView[i] = str.charCodeAt(i);
			}
			return buf;
		}
	},
	socket: {
		list: [],
		open: function() {
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

			chrome.socket.create('udp', {}, function(socketInfo) {
				var socketId = socketInfo.socketId;
				notify.socket.list.push(socketId);
				chrome.socket.bind(socketId, '0.0.0.0', 9000, function(result) {
					if(result) {
						console.log("bind failed");
						console.log(result);
					}
					else {

						// Get info on socket
						chrome.socket.getInfo(socketId, function(d) {
							console.log(socketId);
							console.log(d);
						});

						console.log("connected!  " + result);
						var notification = webkitNotifications.createNotification("",
							"Notify", "Socket open");
						notification.show();

						notify.socket.receiveLoop(socketId, 512, notify.socket.onData);
					}

				});
			});

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

			var str = notify.utils.ab2str(d.data);

			var notification = webkitNotifications.createNotification('icon_32.png', 'Data received', str);
			notification.show();
		}
	}
};

// chrome.app.runtime.onLaunched.addListener(function() {
// 	// chrome.app.tabs.getCurrent(function(tab) {
// 	// 	var tabId = tab.id;
// 	// 	chrome.app.window.create('main.html', {
// 	// 		"type": "normal",
// 	// 		"tabId": tabId
// 	// 	});
// 	// });

// 	console.log(chrome.app.runtime);

// 	notify.socket.open();
// });

// chrome.app.runtime.onRestarted.addListener(function() {
// 	notify.socket.list.forEach(function(s) {
// 		chrome.socket.destroy(s);
// 	});
// });

notify.socket.open();
