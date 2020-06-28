var ws_address = "192.168.58.211",
	ws_port = "5066"; //服务器地址 ， FreeSwitch 112.74.54.80
$(document).ready(function () {
	$(document).on("click", '[data-toggle="soft-function"]', function (e) {
		if ($(this).closest(".disabled").length == 0) {
			var name = $(this).data("action");
			if (name == "login") {
				wySoftPhone.input();
			} else if (name == "logout") {
				wySoftPhone.logout();
			} else if (name == "ready") {
				wySoftPhone.ready();
			} else if (name == "notready") {
				wySoftPhone.notready();
			} else if (name == "answer") {
				wySoftPhone.answer();
			} else if (name == "hungup") {
				wySoftPhone.hungup();
			} else if (name == "hold") {
				wySoftPhone.hold();
			} else if (name == "unhold") {
				wySoftPhone.unhold();
			}
		}
	});
});
var softPhoneUA, currentSession, mediaStream;

var wySoftPhone = {
	dia: null,
	getOptions: function () {
		var options = {
			media: {
				constraints: {
					audio: true,
					video: false
				},
				render: {
					remote: document.getElementById('remoteAudio'),
					local: document.getElementById('localAudio')
				}
			}
		}
		return options;
	},
	input: function () {
		wySoftPhone.dia = layer.open({
			content: $('#wy-login-html').html(),
			type: 1,
			area: ['350px'],
			title: '登录',
			yes: function (index) {
				var extno = $("#extno").val();
				var extpass = $("#extpass").val();
				layer.close(index);
				if (extno != '' && extpass != '') {
					wySoftPhone.login(extno, extpass);
				}
				layer.msg('请输入分机号和密码')
				return false

			}
		});
		$("#extno").focus();
	},
	login(extno, extpass) {
		var config = {
			uri: extno + '@' + ws_address,
			wsServers: 'ws://' + ws_address + ':' + ws_port,
			authorizationUser: extno,
			password: extpass,
			allowLegacyNotifications: true,
			autostart: true,
			register: false
		};
		softPhoneUA = new SIP.UA(config);
		softPhoneUA.on('invite', function (session) {
			console.log(session);
			wySoftPhone.status.CallIn();
			currentSession = session;
			wySoftPhone.sessionEvent(session);

		})
		softPhoneUA.on('connecting', function (args) {
			console.log(args);
			console.log("connecting");
		});
		softPhoneUA.on('connected', function () {
			if (softPhoneUA.isRegistered()) {
				wySoftPhone.status.connect();
			} else {
				wySoftPhone.status.notconnect();
			}
		});
		softPhoneUA.on('unregistered', function (response, cause) {
			console.log(response, cause);
			wySoftPhone.status.notconnect();
		});
		softPhoneUA.on('registered', function (response, cause) {
			console.log(response, cause);

			wySoftPhone.status.connect();
		})
		softPhoneUA.on('disconnected', function (response, cause) {
			console.log(response, cause);

			wySoftPhone.status.logout();
		})
		wySoftPhone.status.login();
		var mediaConstraints = {
			audio: true,
			video: false
		};
	},
	ready: function () {
		wySoftPhone.status.connect()
		softPhoneUA.register({
			register: true
		});
	},
	invite: function (pnumber) {
		currentSession = softPhoneUA.invite(pnumber + "@" + ws_address, wySoftPhone.getOptions());
		wySoftPhone.sessionEvent(currentSession);
		wySoftPhone.status.Hangup();
	},
	logout: function () {
		layer.confirm('是否退出登录', {
			title: '退出',
			closeBtn: false
		}, function (index) {
			//do something
			softPhoneUA.stop({
				register: true
			});

			layer.close(index);
		});
	},
	answer: function () {
		if (currentSession) {
			currentSession.accept(wySoftPhone.getOptions());
		}
	},
	hungup: function () {
		if (currentSession) {
			if (currentSession.hasAnswer) {
				currentSession.bye();
			} else if (currentSession.isCanceled == false) {
				currentSession.cancel();
			} else {
				currentSession.reject();
			}
		}
	},
	hold: function () {
		if (currentSession && currentSession.hasAnswer) {
			currentSession.hold();
		}
	},
	unhold: function () {
		if (currentSession && currentSession.hasAnswer) {
			currentSession.unhold();
		}
	},
	notready: function () {
		layer.confirm('是否断开连接', {
			title: '连接',
			closeBtn: false
		}, function (index) {
			wySoftPhone.status.notconnect()
			softPhoneUA.unregister();
			layer.close(index);
		});

	},
	sessionEvent: function (session) {
		session.on("rejected", function (response, cause) {
			wySoftPhone.status.Hangup();
		});
		session.on("bye", function (response, cause) {
			wySoftPhone.status.Hangup();
		});
		session.on("hold", function (response, cause) {
			wySoftPhone.status.hold();
		});
		session.on("unhold", function (response, cause) {
			wySoftPhone.status.unhold();
		});
		session.on("accepted", function (response, cause) {
			wySoftPhone.status.accepted();
		});
		session.on("cancel", function (response, cause) {
			wySoftPhone.status.Hangup();
		});
	},
	status: {
		login: function () {
			$("#softphone-status").removeClass('ccc').addClass('black').css('pointer-events', "unset").css('cursor', "pointer")
			$('.login').hide()
			$('.logout').show()
			$(".cover").show();
		},
		logout: function () {
			$(".cover").show();
			$("#softphone-status")
			$('.login').show()
			$('.logout').hide()
			$('.ready').show()
			$('.notready').hide()
			$("#softphone-status").removeClass('black').addClass('ccc')
			$('#softphone-answer').addClass('ccc')
			$('#softphone-status1').addClass('ccc')
			$('#softphone-trans').addClass('ccc')
			$('#softphone-hungup').addClass('ccc')
			$('.number-area .numbers').val('')
		},
		connect: function () {
			$(".cover").hide();
			$(".ready").hide()
			$(".notready").show()
			$(".soft-function").removeClass('ccc')
			
		},
		notconnect: function () {
			$(".ready").show()
			$(".cover").show();
			$(".notready").hide()
			$('#softphone-answer').addClass('ccc')
			$('#softphone-status1').addClass('ccc')
			$('#softphone-trans').addClass('ccc')
			$('#softphone-hungup').addClass('ccc')
			$('.number-area .numbers').val('')
		},
		CallIn: function () {
			$('#softphone-answer').addClass('ccc')
			$('.softphone-hungup').removeClass('ccc')
		},
		Hangup: function () {
			$('#softphone-answer').removeClass('ccc')
			$('.softphone-hungup').addClass('ccc')
		},
		hold: function () {
			$('.hold').hide()
			$('.unhold').show()
		},
		unhold: function () {
			$('.hold').show()
			$('.unhold').hide()
		}
	}

}

function getUserMediaSuccess(stream) {
	console.log('getUserMedia succeeded', stream)
	mediaStream = stream;
}

function getUserMediaFailure(e) {
	console.error('getUserMedia failed:', e);
}