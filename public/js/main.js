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

  updatePlayerCount(payload.membership);

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
    
    var nodeB = $('<div class="player socket_' + payload.socket_id + '"><div class="player-image"><img src="https://api.adorable.io/avatars/48/' + payload.socket_id + '@adorable.io.png" height="32" width="32"></div><div class="player-name" title="' + payload.username +'">' + payload.username + '</div></div>');

    var nodeC = $('<div class="player-action"></div>');
    nodeC.addClass('socket_' + payload.socket_id);

    var buttonC = makeInviteButton();
    nodeC.append(buttonC);
    nodeB.append(nodeC);

    nodeA.hide();
    nodeB.hide();
    $('#players').append(nodeA, nodeB); 
    nodeA.slideDown(1000);
    nodeB.slideDown(1000);
  } else {
    var buttonC = makeInviteButton();
    $('.socket_' + payload.socket_id + ' button').replaceWith(buttonC);
    dom_elements.slideDown(1000);
  }

  var messageHtml = '<div class="connection-status"><p>' + payload.username + ' just entered the lobby.</p></div>';
  var messageNode = $(messageHtml);
  $('#messages').append(messageNode);
  updateChatScrollPosition();
});

/* Server responds that someone left a room */
socket.on('player_disconnected', function(payload) {
  if(payload.result == 'fail') {
    alert(payload.message);
    return;
  }

  updatePlayerCount(payload.membership);

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
  var messageHtml = '<div class="connection-status"><p>' + payload.username + ' has left the lobby.</p></div>';
  var messageNode = $(messageHtml);
  $('#messages').append(messageNode);
  updateChatScrollPosition();
});

socket.on('send_message_response', function(payload) {
  if(payload.result == 'fail') {
    alert(payload.message);
    return;
  }
  
  var time = formatAMPM(new Date());

  if(payload.socket_id == socket.id) { // if it's the logged in player's message, different styling
    var messageHtml = '<div class="message current-player-message"><div class="message-inner"><div class="message-details"><div class="message-time">' + time + '</div></div><p>' + payload.message + '</p></div></div>';
  } else {
    var messageHtml = '<div class="message"><div class="player-image"><img src="https://api.adorable.io/avatars/48/' + payload.socket_id + '@adorable.io.png" height="32" width="32"></div><div class="message-inner"><div class="message-details"><div class="message-player">' + payload.username + '</div><div class="message-time">' + time + '</div></div><p>' + payload.message + '</p></div></div>';
  }

  $('#messages').append(messageHtml);
  $('#sendMessageHolder').val('');
  updateChatScrollPosition();
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
  var buttonHtml = '<button type=\'button\' class=\'btn btn-tiny btn-outline\'>Invite</button>';
  var buttonNode = $(buttonHtml);

  return buttonNode;
}

function formatAMPM(date) {
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? '0'+minutes : minutes;
  var strTime = hours + ':' + minutes + ' ' + ampm;
  return strTime;
}

function updatePlayerCount(count) {
  $('.player-count').html(count);
}

function updateChatScrollPosition() {
  $('#messages').animate({
    scrollTop: $('#messages').prop('scrollHeight')
  }, 0);
}

$(function() {
  var payload = {};
  payload.room = chat_room;
  payload.username = username;

  console.log('*** Client Log Message: \'join_room\' payload: ' + JSON.stringify(payload));
  socket.emit('join_room', payload);
});