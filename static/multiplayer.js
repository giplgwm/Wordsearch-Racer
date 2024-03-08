var socket = io();
var player_id;
const gameid = path[2];
var mycolor;
var username;
const player_container_element = document.getElementById('player-list');
const colors = {};
const players = {};
const waiting_modal = document.getElementById('waiting-modal');
const players_ready_section = waiting_modal.querySelector('#players-ready')
const ready_btn = waiting_modal.querySelector('#ready-btn');

const username_modal = document.getElementById('username-modal');
const connectBtn = username_modal.querySelector('#connect');
const userField = username_modal.querySelector('#user');

if (sessionStorage.hasOwnProperty('id')) {
  player_id = sessionStorage['id']
}

if (localStorage.hasOwnProperty('username')) {
  username = localStorage['username'];
  socket.emit('join_game', {game_id: gameid, username: username, player_id: player_id});
} else {
  username_modal.showModal();
}

connectBtn.addEventListener('click', () => {
  let typed_user = userField.value.trim();
  localStorage['username'] = typed_user;
  username = typed_user;
  username_modal.close();
  socket.emit('join_game', {game_id: gameid, username: username, player_id: player_id});
})


function emit_word_found(word) {
  let nodes = [];
  for (let element of currentNodes) {
    col = element.getAttribute('data-column');
    row = element.getAttribute('data-row');
    pos = [row, col];
    nodes.push(pos);
  }
  socket.emit('word_found', {word: word, pid: player_id, nodes: nodes, room: gameid});
}

socket.on('your_id', data => {
  player_id = data['id'];
  username = data['username'];
  mycolor = data['color'];
  sessionStorage['id'] = player_id;
  localStorage['username'] = username;
  players[player_id] = username;
  const root = document.querySelector(':root');
  root.style.setProperty('--player-color', mycolor);
})

socket.on('player_joined', data => {
  let player_username = data['username'];
  let p_color = data['color'];
  let p_id = data['id'];
  colors[p_id] = p_color;
  let player_name_node = document.createElement('li');
  player_name_node.id = p_id
  player_name_node.innerText = player_username;
  player_name_node.style.color = p_color;
  player_container_element.appendChild(player_name_node);
  players[p_id] = player_username;
  let player_ready_ui_element = document.createElement('div');
  player_ready_ui_element.id = `ready-${p_id}`
  player_ready_ui_element.innerHTML = 
      `<h6 style='margin-bottom: 0px;'>${player_username}</h6><svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-circle-x" width="44" height="44" viewBox="0 0 24 24" stroke-width="1.5" stroke="#ff2825" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
    <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
    <path d="M10 10l4 4m0 -4l-4 4" />
  </svg>`;
  players_ready_section.appendChild(player_ready_ui_element);
})

socket.on('player_left', data => {
  let pid = data['id'];
  let player_name_node = document.getElementById(pid);
  player_name_node.remove();
  let player_ready_ui_element = document.getElementById(`ready-${pid}`)
  player_ready_ui_element.remove();
})

socket.on('players_in_game', data => {
  let players_ready = data['ready'];
  if (Object.keys(data['players']).length < 2 || !(players_ready.length >= Object.keys(data['players']).length)) { // If all players who were previously in the game were readied, the game has started. If not, show the modal.
     waiting_modal.showModal();
    
     ready_btn.addEventListener('click', () => {
       socket.emit('player_ready', {gameid: gameid, player: player_id});
       ready_btn.disabled = true;
     });
    
  } else if (players_ready.length >= Object.keys(data['players']).length) {
    //If we join a game already in progress, remove the blur effect from screen so the player can start playing lol
    gridContainer.classList.remove('blurred');
  }
   
  for (let user in data['players']) {
    user = data['players'][user]
    let player_username = user['username'];
    let p_id = user['id'];
    let player_color = user['color']
    let player_ready = user['ready']
    let player_name_node = document.createElement('li');
    player_name_node.id = p_id;
    player_name_node.innerText = player_username;
    player_name_node.style.color = player_color;
    colors[p_id] = player_color;
    player_container_element.appendChild(player_name_node);
    players[p_id] = player_username;
    let player_ready_ui_element = document.createElement('div');
    player_ready_ui_element.id = `ready-${p_id}`;
    if (!player_ready) {
      player_ready_ui_element.innerHTML = 
        `<h6 style='margin-bottom: 0px;'>${player_username}</h6>
        <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-circle-x" width="44" height="44" viewBox="0 0 24 24" stroke-width="1.5" stroke="#ff2825" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
            <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
            <path d="M10 10l4 4m0 -4l-4 4" />
          </svg>`;
    } else {
      player_ready_ui_element.innerHTML = 
      `<h6 style='margin-bottom: 0px;'>${player_username}</h6>
      <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-circle-check" width="44" height="44" viewBox="0 0 24 24" stroke-width="1.5" stroke="#00b341" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
        <path d="M9 12l2 2l4 -4" />
      </svg>`;
    }
    
    players_ready_section.appendChild(player_ready_ui_element);
  }
  for (let key in puzzle.found_words) {
    let p_color = colors[puzzle.found_words[key][0]]
    let used_nodes = puzzle.found_words[key][1]
    crossoutWord(key, color=p_color)
    start_element = find_element_from_coords(used_nodes[0][0], used_nodes[0][1]);
    end_element = find_element_from_coords(used_nodes[used_nodes.length - 1][0], used_nodes[used_nodes.length - 1][1]);
    drawlinethroughword(start_element, end_element, p_color)
  }
})

socket.on('word_found', data => {
  word = data['word'];
  pid = data['pid'];
  used_color = colors[pid];
  used_nodes = data['nodes'];
  puzzle.found_words[word] = pid; 
  crossoutWord(word, used_color);
  //highlightLetters(used_nodes, used_color);
  start_element = find_element_from_coords(used_nodes[0][0], used_nodes[0][1]);
  end_element = find_element_from_coords(used_nodes[used_nodes.length - 1][0], used_nodes[used_nodes.length - 1][1]);
  drawlinethroughword(start_element, end_element, used_color)
})

socket.on('game_over', data => {
  const final_scores = data['scores'];
  winModal.showModal();
  const textsection = winModal.querySelector('#scores');
  for (let key in final_scores) {
    let player_div = document.createElement('div');
    let player_name = document.createElement('h5');
    player_name.innerText = players[key];
    let player_score = document.createElement('h6');
    player_score.innerText = final_scores[key];
    player_div.appendChild(player_name);
    player_div.appendChild(player_score);
    textsection.appendChild(player_div);
  }
  socket.disconnect();
})

socket.on('player_ready', data => {
  let ready_player_id = data['player'];
  let ready_player_username = players[ready_player_id];
  let ready_ui_div = document.getElementById(`ready-${ready_player_id}`);
  ready_ui_div.innerHTML = 
  `<h6 style='margin-bottom: 0px;'>${ready_player_username}</h6>
  <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-circle-check" width="44" height="44" viewBox="0 0 24 24" stroke-width="1.5" stroke="#00b341" fill="none" stroke-linecap="round" stroke-linejoin="round">
  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
  <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
  <path d="M9 12l2 2l4 -4" />
</svg>`;
})

socket.on('game_start', data => {
  waiting_modal.close();
  gridContainer.classList.remove('blurred');
  addControls();
})

//Add this for cleanup so someone not in our pid list disconnects properly, and all sockets get closed asap
window.addEventListener("beforeunload", () => {
  socket.disconnect();
});

function find_element_from_coords(row, col) {
  return document.querySelector(`[data-row="${row}"][data-column="${col}"]`)
}