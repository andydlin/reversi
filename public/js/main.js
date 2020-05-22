function getURLParameters(whichParam) {
  var pageURL = window.location.search.substring(1);
  var pageURLVariables = pageURL.split('&');
  for(var i = 0; i < pageURLVariables.length; i++) {
    var parameterName = pageURLVariables[i].split('=');
    if(parameterName[0] == whichParam) {
      return parameterName[1];
    }
  }
}

var username = getURLParameters('username');
if('undefined' == typeof username || !username) {
  username = 'Anonymous_' + Math.random();
}

var chat_room = getURLParameters('game_id');
if('undefined' == typeof chat_room || !char_room) {
  chat_room = 'lobby';
}

/* Connect to socket server */
var socket = io.connect();

/* Server sends log message */
socket.on('log', function(array) {
  console.log.apply(console, array);
});

/* Server responds that someone joined a room */
socket.on('join_room_response', function(payload) {
  if(payload.result == 'fail') {
    alert(payload.message);
    return;
  }
console.log('payload.socket_id = ' + payload.socket_id);
console.log('socket.id = ' + socket.id);
  /* If we are being notified that we joined the room, then ignore it */
  if(payload.socket_id == socket.id) {
    return;
  }

  /* If someone joined, add them to the lobby */
  var dom_elements = $('.socket_' + payload.socket_id);

  /* If no entry for person */
  if(dom_elements.length == 0) {
    var nodeA = $('<div></div>');
    nodeA.addClass('socket_' + payload.socket_id);
    
    var nodeB = $('<div></div>');
    nodeB.addClass('socket_' + payload.socket_id);

    var nodeC = $('<div></div>');
    nodeC.addClass('socket_' + payload.socket_id);

    nodeB.append('<h4>' + payload.username + '</h4>');

    var buttonC = makeInviteButton();
    nodeC.append(buttonC);

    nodeA.hide();
    nodeB.hide();
    nodeC.hide();
    $('#players').append(nodeA, nodeB, nodeC); 
    nodeA.slideDown(1000);
    nodeB.slideDown(1000);
    nodeC.slideDown(1000);
  } else {
    var buttonC = makeInviteButton();
    $('.socket_' + payload.socket_id + ' button').replaceWith(buttonC);
    dom_elements.slideDown(1000);
  }

  var messageHtml = '<p>' + payload.username + ' just entered the lobby.</p>';
  var messageNode = $(messageHtml);
  messageNode.hide();
  $('#messages').append(messageNode);
  messageNode.slideDown(1000);
});

/* Server responds that someone left a room */
socket.on('player_disconnected', function(payload) {
  if(payload.result == 'fail') {
    alert(payload.message);
    return;
  }

  /* If we are being notified that we left the room, then ignore it */
  if(payload.socket_id == socket.id) {
    return;
  }

  /* If someone exists the lobby */
  var dom_elements = $('.socket_' + payload.socket_id);

  /* If something exists */
  if(dom_elements.length != 0) {
    dom_elements.slideUp(1000);
  }

  /* Manage message that a player has left */
  var messageHtml = '<p>' + payload.username + ' has left the lobby.</p>';
  var messageNode = $(messageHtml);
  messageNode.hide();
  $('#messages').append(messageNode);
  messageNode.slideDown(1000);
});

socket.on('send_message_response', function(payload) {
  if(payload.result == 'fail') {
    alert(payload.message);
    return;
  }
  $('#messages').append('<p><b>' + payload.username + ' says:</b> ' + payload.message + '</p>');
});

function send_message() {
  var payload = {};
  payload.room = chat_room;
  payload.username = username;
  payload.message = $('#sendMessageHolder').val();
  console.log('*** Client Log Message: \'send_message\' payload: ' + JSON.stringify(payload));
  socket.emit('send_message', payload);
}

function makeInviteButton() {
  var buttonHtml = '<button type=\'button\' class=\'btn btn-small btn-secondary\'>Invite</button>';
  var buttonNode = $(buttonHtml);

  return buttonNode;
}

$(function() {
  var payload = {};
  payload.room = chat_room;
  payload.username = username;

  console.log('*** Client Log Message: \'join_room\' payload: ' + JSON.stringify(payload));
  socket.emit('join_room', payload);
});