const createbtn = document.getElementById('createbtn');
const quickplaybtn = document.getElementById('quickplaybtn');
const cascadecontainer = document.getElementById('cascade-container');

document.getElementById('quickplay-multiplayer').querySelector('button').addEventListener('click', () => {
    window.location.pathname = '/quick-play';
});

document.getElementById('quickplay-solo').querySelector('button').addEventListener('click', () => {
    window.location.pathname = '/quick-play-solo';
});

document.getElementById('create-puzzle').querySelector('button').addEventListener('click', () => {
    window.location.pathname = '/create';
});

setInterval(() => {
  let new_letter = document.createElement('span');
  new_letter.style.position = 'absolute';
  new_letter.style.left = `${Math.random() * window.innerWidth}px`;
  new_letter.style.fontSize = `${Math.random() * 48 + 12}px`;
  new_letter.classList.add('cascade');
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  const randomIndex = Math.floor(Math.random() * alphabet.length);
  new_letter.innerText = alphabet[randomIndex];
  cascadecontainer.appendChild(new_letter); // Make sure you have a reference to the container if it's not the body

  // Wait for animation to complete before removing the element
  setTimeout(() => {
    new_letter.remove();
  }, 3000); // Matches the animation-duration of 3s
}, 200);


