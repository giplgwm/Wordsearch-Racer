# Wordsearch Racer
This is a real-time multiplayer word search webapp built with Flask and socketio. Find the demo [here](http://wordsearch-racer.replit.app)

I built this to get more practice with javascript, as well as an introduction to flask and websockets. After reading "A Common Sense Guide to Data Structures and Algorithms" a word search generator seemed 
like an interesting challenge to tackle. The word search class I wrote to start this project has its own repo with a much more involved writeup [here](https://github.com/giplgwm/wordsearch).

## Issues
The game does not work properly on mobile devices. This is because the way we're marking found words is an svg overlay and getting that to properly align with the game on a mobile layout has been tricky.
