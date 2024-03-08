const gridContainer = document.getElementById('game-container');
let isDragging = false; 
let currentWord = []; 
let currentNodes = [];
const winModal = document.getElementById('win-modal');
const wordlist_words = document.querySelectorAll('.wordlist-word');

const path = window.location.pathname.split('/')
const isMultiplayerGame = (path[1] === 'play')


//new puzzle button TODO add an ID 
winModal.querySelector('#newpuzzle').addEventListener('click', () => {
  window.location.pathname = '/create'
});

const link_box = document.getElementById('link-box')
link_box.innerText = window.location.href

document.getElementById('copy-link-btn').addEventListener('click', () => {
  navigator.clipboard.writeText(window.location.href)
    .then(() => {
      link_box.innerText = 'Copied!'
      setTimeout(() => {
        link_box.innerText = window.location.href;
      }, 3000);
    })
    .catch(err => {
      console.error('Error copying link: ', err);
    });
});

console.log('is multiplayer?', isMultiplayerGame)
if (!isMultiplayerGame) {
  //If not multiplayer, set up the UI elements on the solo win popup.
  
  //Reset button TODO add an ID
  winModal.querySelectorAll('button')[1].addEventListener('click', () => {
    window.location.reload();
  });
  addControls();  
}



function isvalidselection(node) {
  if (currentNodes.length < 1) {
    return true;
  }
  col = node.getAttribute('data-column')
  row = node.getAttribute('data-row')
  return isneighbor([row, col]) && followspath([row, col])
}

function isneighbor(coords) {
  last_node = currentNodes[currentNodes.length-1];
  last_col = last_node.getAttribute('data-column');
  last_row = last_node.getAttribute('data-row');
  new_col = coords[1];
  new_row = coords[0];

  if ((Math.abs(last_row - new_row) <= 1) && (Math.abs(last_col - new_col) <= 1)) {
    return true
  }
  else {
  return false
  }
}

function followspath(coords) {
  if (currentNodes.length <= 1) {
    return true
  }
  
  two_nodes_ago = currentNodes[currentNodes.length-2]
  oldest_col = two_nodes_ago.getAttribute('data-column');
  oldest_row = two_nodes_ago.getAttribute('data-row');
  last_node = currentNodes[currentNodes.length-1];
  last_col = last_node.getAttribute('data-column');
  last_row = last_node.getAttribute('data-row');
  new_col = coords[1];
  new_row = coords[0];
  
  new_dx = new_col - last_col
  old_dx = last_col - oldest_col
  
  new_dy = new_row - last_row
  old_dy = last_row - oldest_row
  if (new_dx == old_dx && new_dy == old_dy) {
    return true
  } else {
    return false
  }
}



function word_found(word, reversed=false) {
  if (isMultiplayerGame) {
    console.log('word found: ', word)
    emit_word_found(word);
    return
  }
  puzzle.found_words[word] = true;
  if (Object.keys(puzzle.found_words).length === puzzle.hidden_words.length) {
    winModal.showModal();
  }
  console.log('word found', word)
  crossoutWord(word);
  drawlinethroughword(currentNodes[0], currentNodes[currentNodes.length - 1]);
}

function resetLetterSelection() {
  //Reset the highlights and arrays
  gridContainer.querySelectorAll('.selected').forEach(el => {
    el.classList.remove('selected'); 
  });
  currentWord = [];
  currentNodes = [];
}

function startOrEndPosMatches(pos) {
  let start_pos = currentNodes[0];
  let end_pos = currentNodes[currentNodes.length - 1];
  
  let selection_pos = [Number(start_pos.getAttribute('data-row')), Number(start_pos.getAttribute('data-column'))]
  let end_selection_pos = [Number(end_pos.getAttribute('data-row')), Number(end_pos.getAttribute('data-column'))]
  
  return ((pos[0] === end_selection_pos[0] && pos[1] === end_selection_pos[1]) || (pos[0] === selection_pos[0] && pos[1] === selection_pos[1]))
}

function crossoutWord(word, color="var(--player-color)") {
  for (const element of wordlist_words) {
    if (element.innerText == word) {
      element.style.textDecoration = `line-through ${color}`;
      element.style.color = 'black';
      break;
    }
  }
}
function highlightLetters(nodes, color="var(--player-color)") {
  if (isMultiplayerGame) {
    for (let item of nodes) {
      let row = item[0];
      let col = item[1];
      let matchingElement = document.querySelector(`[data-row="${row}"][data-column="${col}"]`);
      matchingElement.style.background = color;
    }
    return;
  } else {
    for (let element of currentNodes) {
      element.classList.add('found_word');
    }
  }

}

function addControls() {
  document.body.addEventListener('mousedown', (event) => {
    event.preventDefault();
    if (event.target.classList.contains('letter')) {
      if (!isvalidselection(event.target)) {
        console.error('NOT VALID')
        return;
      }
      isDragging = true; 
      currentWord.push(event.target.innerText); // Record starting letter
      event.target.classList.add('selected'); 
      currentNodes.push(event.target);
    }
  });

  document.body.addEventListener('mousemove', (event) => {
    if (event.target.classList.contains('selected')) {
      if (event.target == currentNodes[currentNodes.length - 1]) {
        return;
      } else {
        index = currentNodes.indexOf(event.target);
        removed_nodes = currentNodes.slice(index+1, currentNodes.length);
        currentNodes = currentNodes.slice(0, index + 1);
        currentWord = currentWord.slice(0, index + 1);
        for (let element of removed_nodes) {
          element.classList.remove('selected');
        }
        return;
      }
    }
    if (isDragging && event.target.classList.contains('letter')) {
      if (!isvalidselection(event.target)) {
        return;
      }
      let col = event.target.getAttribute('data-column')
      let row = event.target.getAttribute('data-row')
      event.target.classList.add('selected'); 
      currentWord.push(event.target.innerText); 
      currentNodes.push(event.target);
    }
  });

  document.body.addEventListener('mouseup', (event) => {

    isDragging = false;
    let cw_str = '' //current word string

    for (let letter of currentWord) {
      cw_str += letter;
    }
    if (cw_str.length < 3) {
      resetLetterSelection();
      return;
    }
    console.log(cw_str)
    //check if we found a word, or duplicate word!
    cw_str_reversed = cw_str.split('').reverse().join('');
    if (puzzle.found_words.hasOwnProperty(cw_str) || puzzle.found_words.hasOwnProperty(cw_str_reversed)) { //If we already found this word, ignore it
      resetLetterSelection();
      return;
    }
    for (let wordObject of puzzle.hidden_words) {
      let word = wordObject.word;
      let pos = wordObject.pos;
      console.log(word)
      if (word === cw_str) {
        if (startOrEndPosMatches(pos)) {
          word_found(cw_str);
        }
      }
      if (word === cw_str_reversed) {
        if (startOrEndPosMatches(pos)) {
          word_found(cw_str_reversed, true);
        }
      }
    }

    resetLetterSelection();

  });

  //TOUCH CONTROLS HERE
  document.body.addEventListener('touchstart', (event) => {
    const touch = event.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    if (target.classList.contains('letter')) {
      if (!isvalidselection(target)) {
        console.error('NOT VALID')
        return;
      }
      currentWord.push(target.innerText); // Record starting letter
      target.classList.add('selected'); 
      currentNodes.push(target);
    }
  }, {passive: false});

  document.body.addEventListener('touchmove', (event) => {
    const touch = event.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    if (target.classList.contains('selected')) {
      if (target == currentNodes[currentNodes.length - 1]) {
        return;
      } else {
        index = currentNodes.indexOf(target);
        removed_nodes = currentNodes.slice(index+1, currentNodes.length);
        currentNodes = currentNodes.slice(0, index + 1);
        currentWord = currentWord.slice(0, index + 1);
        for (let element of removed_nodes) {
          element.classList.remove('selected');
        }
        return;
      }
    }
    if (target.classList.contains('letter')) {
      if (!isvalidselection(target)) {
        return;
      }
      let col = target.getAttribute('data-column')
      let row = target.getAttribute('data-row')
      target.classList.add('selected'); 
      currentWord.push(target.innerText); 
      currentNodes.push(target);
    }
  }, {passive: false});

  document.body.addEventListener('touchend', (event) => {
    let cw_str = '' //current word string

    for (let letter of currentWord) {
      cw_str += letter;
    }
    if (cw_str.length < 3) {
      resetLetterSelection();
      return;
    }
    console.log(cw_str)
    //check if we found a word, or duplicate word!
    cw_str_reversed = cw_str.split('').reverse().join('');
    if (puzzle.found_words.hasOwnProperty(cw_str) || puzzle.found_words.hasOwnProperty(cw_str_reversed)) { //If we already found this word, ignore it
      resetLetterSelection();
      return;
    }
    for (let wordObject of puzzle.hidden_words) {
      let word = wordObject.word;
      let pos = wordObject.pos;
      console.log(word)
      if (word === cw_str) {
        if (startOrEndPosMatches(pos)) {
          word_found(cw_str);
        }
      }
      if (word === cw_str_reversed) {
        if (startOrEndPosMatches(pos)) {
          word_found(cw_str_reversed, true);
        }
      }
    }

    resetLetterSelection();

  });
}
const svg_overlay = document.getElementById('svg-overlay');
function drawlinethroughword(start, end, color="var(--player-color)") {
  
  startRect = start.getBoundingClientRect()
  endRect = end.getBoundingClientRect()
  startMidX = startRect.left + (startRect.width/2)
  startMidY = startRect.top + (startRect.height/2)
  endMidX = endRect.left + (endRect.width/2)
  endMidY = endRect.top + (endRect.height/2)

  // Create a new line element
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');

  // Set the position and styling of the line
  line.setAttribute('x1', startMidX);
  line.setAttribute('y1', startMidY);
  line.setAttribute('x2', endMidX);
  line.setAttribute('y2', endMidY);
  line.setAttribute('stroke', color); // Line color
  line.setAttribute('stroke-width', '6'); // Line thickness

  // Append the line to the SVG overlay
  svg_overlay.appendChild(line);
}

document.addEventListener('DOMContentLoaded', () => {
  const gameContainer = document.getElementById('game-container');
  var svgOverlay = document.getElementById('svg-overlay');
  var topPosition = gameContainer.getBoundingClientRect().top; // Get the top position of the game container

  svgOverlay.style.top = topPosition + 'px'; // Set the top position of the svg-overlay
});