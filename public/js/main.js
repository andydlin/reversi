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
if('undefined' == typeof chat_room || !chat_room) {
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

    var buttonC = makeInviteButton(payload.socket_id);
    nodeC.append(buttonC);
    nodeB.append(nodeC);

    nodeA.hide();
    nodeB.hide();
    $('#players').append(nodeA, nodeB); 
    nodeA.slideDown(1000);
    nodeB.slideDown(1000);
  } else {
    uninvite(payload.socket_id);
    var buttonC = makeInviteButton(payload.socket_id);
    $('.socket_' + payload.socket_id + ' button').replaceWith(buttonC);
    dom_elements.slideDown(1000);
  }

  var messageHtml = '<div class="connection-status"><p>' + payload.username + ' just entered the room.</p></div>';
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
  var messageHtml = '<div class="connection-status"><p>' + payload.username + ' has left the room.</p></div>';
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

socket.on('invite_response', function(payload) {
  if(payload.result == 'fail') {
    alert(payload.message);
    return;
  }

  var newNode = makeInvitedButton(payload.socket_id);
  $('.socket_' + payload.socket_id + ' button').replaceWith(newNode);
});

socket.on('invited', function(payload) {
  if(payload.result == 'fail') {
    alert(payload.message);
    return;
  }

  var newNode = makePlayButton(payload.socket_id);
  $('.socket_' + payload.socket_id + ' button').replaceWith(newNode);
});

socket.on('uninvite_response', function(payload) {
  if(payload.result == 'fail') {
    alert(payload.message);
    return;
  }

  var newNode = makeInviteButton(payload.socket_id);
  $('.socket_' + payload.socket_id + ' button').replaceWith(newNode);
});

socket.on('uninvited', function(payload) {
  if(payload.result == 'fail') {
    alert(payload.message);
    return;
  }

  var newNode = makeInviteButton(payload.socket_id);
  $('.socket_' + payload.socket_id + ' button').replaceWith(newNode);
});

socket.on('game_start_response', function(payload) {
  if(payload.result == 'fail') {
    alert(payload.message);
    return;
  }

  var newNode = makeEngagedButton(payload.socket_id);
  $('.socket_' + payload.socket_id + ' button').replaceWith(newNode);

  window.location.href = 'game.html?username=' + username + '&game_id=' + payload.game_id;
});

socket.on('uninvited', function(payload) {
  if(payload.result == 'fail') {
    alert(payload.message);
    return;
  }

  var newNode = makeInviteButton(payload.socket_id);
  $('.socket_' + payload.socket_id + ' button').replaceWith(newNode);
});

function invite(who) {
  var payload = {};
  payload.requested_user = who;
  
  console.log('*** Client Log Message: \'invite\' payload: ' + JSON.stringify(payload));
  socket.emit('invite', payload);
}

function uninvite(who) {
  var payload = {};
  payload.requested_user = who;
  
  console.log('*** Client Log Message: \'uninvite\' payload: ' + JSON.stringify(payload));
  socket.emit('uninvite', payload);
}

function game_start(who) {
  var payload = {};
  payload.requested_user = who;
  
  console.log('*** Client Log Message: \'game start\' payload: ' + JSON.stringify(payload));
  socket.emit('game_start', payload);
}

function send_message() {
  var payload = {};
  payload.room = chat_room;
  payload.message = $('#sendMessageHolder').val();
  console.log('*** Client Log Message: \'send_message\' payload: ' + JSON.stringify(payload));
  socket.emit('send_message', payload);
}

function makeInviteButton(socket_id) {
  var buttonHtml = '<button type=\'button\' class=\'btn btn-tiny btn-outline\'>Invite</button>';
  var buttonNode = $(buttonHtml);

  buttonNode.click(function() {
    invite(socket_id);
  });

  return buttonNode;
}

function makeInvitedButton(socket_id) {
  var buttonHtml = '<button type=\'button\' class=\'btn btn-tiny btn-outline\'>Invited</button>';
  var buttonNode = $(buttonHtml);

  buttonNode.click(function() {
    uninvite(socket_id);
  });

  return buttonNode;
}

function makePlayButton(socket_id) {
  var buttonHtml = '<button type=\'button\' class=\'btn btn-tiny btn-secondary\'>Play</button>';
  var buttonNode = $(buttonHtml);

  buttonNode.click(function() {
    game_start(socket_id);
  });

  return buttonNode;
}

function makeEngagedButton() {
  var buttonHtml = '<button type=\'button\' class=\'btn btn-tiny btn-outline\'>Engaged</button>';
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

  $('#quit').append('<a href="lobby.html?username=' + username + '" class="btn btn-small btn-outline">Quit</a>');
});

var old_board = [
  ['?', '?', '?', '?', '?', '?', '?', '?'],
  ['?', '?', '?', '?', '?', '?', '?', '?'],
  ['?', '?', '?', '?', '?', '?', '?', '?'],
  ['?', '?', '?', '?', '?', '?', '?', '?'],
  ['?', '?', '?', '?', '?', '?', '?', '?'],
  ['?', '?', '?', '?', '?', '?', '?', '?'],
  ['?', '?', '?', '?', '?', '?', '?', '?'],
  ['?', '?', '?', '?', '?', '?', '?', '?']
];

var my_color = ' ';
var opponent_color = '';
var opponentName = '';
var myCoin = '';
var opponentCoin = '';
var interval_timer = '';

socket.on('game_update', function(payload) {
  console.log('*** Client Log Message: \'game_upate\' payload: ' + JSON.stringify(payload));

  /* Check for a good board update */
  if(payload.result == 'fail') {
    console.log(payload.message);
    window.location.href = 'lobby.html?username=' + username;
    return;
  }

  /* Check or a good board in the payload */
  var board = payload.game.board;
  if('undefined' == typeof board || !board) {
    console.log('Internal erorr: received a malformed board update from the server');
    return;
  }
  
  /* Update my color */
  if(socket.id == payload.game.player_white.socket) {
    my_color = 'white';
    myCoin = createWhiteCoin();
    opponent_color = 'black';
    opponentName = payload.game.player_black.username;
    opponentCoin = createBlackCoin();
  } else if(socket.id == payload.game.player_black.socket) {
    my_color = 'black';
    myCoin = createBlackCoin();
    opponent_color = 'white';
    opponentName = payload.game.player_white.username;
    opponentCoin = createWhiteCoin();
  } else {
    // Something weird is going on, like three people playing at once
    // Send client back to the lobby
    window.location.href = 'lobby.html?username=' + username;
    return;
  }
  console.log(myCoin);
  console.log(opponentCoin);

  //$('#myColor').html('<h2>My color is ' + my_color + '</h2>');

  // Create player details
  // Black is Xbox, White is PS
  var myDetails, opponentDetails, myHtml, opponentHtml = '';
  if(my_color == 'white') {
    myDetails = createPlayerWhiteDetails('You');
    myHtml = myDetails + '<div class="score" id="whiteSum">0</div>';
    opponentDetails = createPlayerBlackDetails(opponentName);
    opponentHtml = '<div class="score" id="blackSum">0</div>' + opponentDetails;
  } else if(my_color == 'black') {
    myDetails = createPlayerBlackDetails('You');
    myHtml = myDetails + '<div class="score" id="blackSum">0</div>';
    opponentDetails = createPlayerWhiteDetails(opponentName);
    opponentHtml = '<div class="score" id="whiteSum">0</div>' + opponentDetails;
  }

  var whoseTurnCoin = payload.game.whose_turn == my_color ? myCoin : opponentCoin;
  var whoseTurnText = payload.game.whose_turn == my_color ? 'Your turn.' : opponentName + '\'s turn.';
  var whoseTurnHtml = '<div class="turn-details">' + whoseTurnCoin + '<h4>' + whoseTurnText + '</h4></div><div class="elapsed-time">Elapsed time - <span id="elapsed"></span></div>';

  $('#player1Details').html(myHtml);
  $('#player2Details').html(opponentHtml);
  $('#whose_turn').html(whoseTurnHtml);

  clearInterval(interval_timer);
  interval_timer = setInterval(function(last_time) {
    return function() {
      var d = new Date();
      var elapsedMilli = d.getTime() - last_time;
      var minutes = Math.floor(elapsedMilli / (60 * 1000));
      var seconds = Math.floor((elapsedMilli % (60 * 1000)) / 1000);

      if(seconds < 10) {
        $('#elapsed').html(minutes + ':0' + seconds);
      } else {
        $('#elapsed').html(minutes + ':' + seconds);
      }
    }
  }(payload.game.last_move_time), 1000);

  /* Animate changes to the board */
  var blacksum = 0;
  var whitesum = 0;
  var row, column;
  for(row = 0; row < 8; row++) {
    for(column = 0; column < 8; column++) {
      if(board[row][column] == 'b') {
        blacksum++;
      }

      if(board[row][column] == 'w') {
        whitesum++;
      }

      (function(row, column) {
        /* If a board space has changed */
        if(old_board[row][column] != board[row][column]) {
          if(old_board[row][column] == '?' && board[row][column] == ' ') {
            $('#' + row + '_' + column).html('<div class="scene"></scene>');
          } else if(old_board[row][column] == '?' && board[row][column] == 'w') {
            var coin = createWhiteCoin('place-coin');
            $('#' + row + '_' + column).html(coin);
          } else if(old_board[row][column] == '?' && board[row][column] == 'b') {
            var coin = createBlackCoin('place-coin');
            $('#' + row + '_' + column).html(coin);
          } else if(old_board[row][column] == ' ' && board[row][column] == 'w') {
            var coin = createWhiteCoin('place-coin');
            $('#' + row + '_' + column).html(coin);
          } else if(old_board[row][column] == ' ' && board[row][column] == 'b') {
            var coin = createBlackCoin('place-coin');
            $('#' + row + '_' + column).html(coin);
          } else if(old_board[row][column] == 'w' && board[row][column] == ' ') {
            var coin = createWhiteCoin('remove-coin');
            $('#' + row + '_' + column).html(coin);
          } else if(old_board[row][column] == 'b' && board[row][column] == ' ') {
            var coin = createBlackCoin('remove-coin');
            $('#' + row + '_' + column).html(coin);
          } else if(old_board[row][column] == 'w' && board[row][column] == 'b') {
            var coin = createWhiteCoin('flip-coin');
            $('#' + row + '_' + column).html(coin);
          } else if(old_board[row][column] == 'b' && board[row][column] == 'w') {
            var coin = createBlackCoin('flip-coin');
            $('#' + row + '_' + column).html(coin);
          } else {
            $('#' + row + '_' + column).html('error');
          }
        } // end if board space changed
      }(row, column));

      /* Set up interactivity */
      $('#' + row + '_' + column).off('click');
      $('#' + row + '_' + column).removeClass('hovered-over');

      if(payload.game.whose_turn === my_color) {
        if(payload.game.legal_moves[row][column] === my_color.substr(0, 1)) {
          $('#' + row + '_' + column).addClass('hovered-over');
          $('#' + row + '_' + column).click(function(r, c) {
            return function() {
              var payload = {};
              payload.row = r;
              payload.column = c; 
              payload.color = my_color;
              console.log('** Client Log Message: \'play_token\' paylaod:' + JSON.stringify(payload));
              socket.emit('play_token', payload);
            };
          }(row, column));
        }
      } // end if
    } // end for
  } // end for
  
  var flippingAnimation = anime({
    targets: '.scene.flip-coin .coin',
    keyframes: [
      {translateY: -10, rotateY: '.25turn', scale: 1.5},
      {translateY: 0, rotateY: '.5turn', scale: 1}
    ],
    duration: 500,
    delay: anime.stagger(150),
    easing: 'easeInElastic(1, .6)'
  });

  flippingAnimation.finished.then(function() {
    $('.scene.flip-coin').removeClass('flip-coin');
  });

  $('#blackSum').html(blacksum);
  $('#whiteSum').html(whitesum);

  old_board = board;
});

socket.on('play_token_response', function(payload) {
  console.log('*** Client Log Message: \'play_token_response\' payload: ' + JSON.stringify(payload));

  /* Check for a good play_token_response */
  if(payload.result == 'fail') {
    console.log(payload.message);
    alert(payload.message);
    return;
  }
});

socket.on('game_over', function(payload) {
  console.log('*** Client Log Message: \'game_over\' payload: ' + JSON.stringify(payload));

  /* Check for a good play_token_response */
  if(payload.result == 'fail') {
    console.log(payload.message);
    return;
  }

  var winnerText = payload.who_won == my_color ? 'You won!' : opponentName + ' won, good try!';

  // Display game over message
  setTimeout(function() {
    $('#game_over').html('<h1>Game Over</h1><h2>' + winnerText + '</h2>');
    $('#game_over').append('<a href="lobby.html?username=' + username + '" class="btn btn-tiny btn-primary">Return to the lobby</a>');
    $('#whose_turn').hide();
    clearInterval(interval_timer);
  }, 500);
});

function createPlayerWhiteDetails(username) {
  var html = '<div class="player-details"><div class="player-coin player-coin--ps"><span class="coin-highlight"></span><img src="assets/images/ps-logo.svg"></div><h4 class="player-ps">' + username + '</h4></div>';

  return html;
}

function createPlayerBlackDetails(username) {
  var html = '<div class="player-details"><div class="player-coin player-coin--xbox"><span class="coin-highlight"></span><img src="assets/images/xbox-logo.svg"></div><h4 class="player-xbox">' + username + '</h4></div>';

  return html;
}

function createWhiteCoin(classes) {
  var html = '<div class="scene' + ' ' + classes + '"><div class="coin coin-ps"><div class="coin-face coin-face--front"><span class="coin-highlight"></span><img src="assets/images/ps-logo.svg"></div><div class="coin-face coin-face--back"><span class="coin-highlight"></span><img src="assets/images/xbox-logo.svg"></div></div></div>';

  return html;
}


function createBlackCoin(classes) {
  var html = '<div class="scene' + ' ' + classes + '"><div class="coin coin-xbox"><div class="coin-face coin-face--front"><span class="coin-highlight"></span><img src="assets/images/xbox-logo.svg"></div><div class="coin-face coin-face--back"><span class="coin-highlight"></span><img src="assets/images/ps-logo.svg"></div></div></div>';

  return html;
}