const genbtn = document.getElementById('generate-btn');
//form and inputs
const wordsearchform = document.getElementById('wordsearch-form');
let puzzle = undefined;
const previewtitleText = document.getElementById('puzzle-title');
const previewGrid = document.getElementById('preview-grid')
const previewcontainer = document.getElementById('wordsearch-preview-container')
const playonlinebtn = document.getElementById('playonlinebtn')
const playsolobtn = document.getElementById('playsolobtn')
const errorpopup = document.getElementById('error-popup')
const errortext_element = errorpopup.querySelector('#error-text')

document.addEventListener('DOMContentLoaded', () => {
  previewcontainer.style.display = 'None';
})

genbtn.addEventListener('click', () => {
  //create the puzzle from the form
  const size = wordsearchform.querySelector('[name=size]').value
  const title = wordsearchform.querySelector('[name=title]').value
  const word_list = wordsearchform.querySelector('[name=word-list]').value
  if (size < 3 || size > 18) {
    errorPopup("Puzzle size not in a valid range. Choose a range between 3 and 18 please.");
    return;
  }
  if (title === '') {
     errorPopup("Please add a title");
    return;
  }
  if (word_list === '') {
     errorPopup("Please add a list of words separated by commas, like this\npeaches, bears, apples, bananas");
    return;
  }
  const formdata = new FormData(wordsearchform)
  fetch('/generate-puzzle', {
    method: 'POST',
    body: formdata
  })
  .then(response => response.json())
    .then(data => {
      if (data.hasOwnProperty('message')) {
        console.error(data['message'])
        return;
      }
      puzzle = data
      previewGrid.innerHTML = '';

      for (let row of data.grid) {
         const rowDiv = document.createElement('div');
         rowDiv.classList.add('row'); 

         for (let letter of row) {
             const letterSpan = document.createElement('span');
             letterSpan.textContent = letter;
             rowDiv.appendChild(letterSpan);
         }

         previewGrid.appendChild(rowDiv);
      }
      previewcontainer.style.display = 'Block';
    })
  .catch(error => {
    console.log(error)
  })
});

playonlinebtn.addEventListener('click', () => {
  puzzle = JSON.stringify(puzzle)
  fetch('/create-game', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: puzzle
  })
  .then((response) => {
    console.log('game creation request sent: '+ response.json())
    window.location.href = response.url
  })
});

playsolobtn.addEventListener('click', () => {
    puzzle = JSON.stringify(puzzle);
    let encodedJSON = encodeURIComponent(puzzle);
    let url = '/play-solo?puzzle=' + encodedJSON; 
    window.location.href = url;
});

function errorPopup(errortext) {
  errortext_element.innerText = errortext;
  errorpopup.show();
  setTimeout(() => {
    errorpopup.close();
  }, 2000)
}
