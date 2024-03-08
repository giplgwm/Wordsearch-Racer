import eventlet

eventlet.monkey_patch()

from wordsearch import Wordsearch
from flask import Flask, render_template, request, jsonify, redirect, url_for
from pymongo import MongoClient
import uuid
from flask_socketio import SocketIO, join_room, leave_room, emit
import json
import urllib.parse
import os
import random

# Server Mem.
wordlists = []
sessions_to_pids = {}
games = {
}  # key: game_id value: {players: Dict{pid, username, color}, puzzle: Object, ready: List[]}
colors = [
    '#000000', '#000033', '#000066', '#000099', '#0000CC', '#0000FF',
    '#003300', '#003333', '#003366', '#003399', '#0033CC', '#0033FF',
    '#006600', '#006633', '#006666', '#006699', '#0066CC', '#0066FF',
    '#009900', '#009933', '#009966', '#009999', '#0099CC', '#0099FF',
    '#00CC00', '#00CC33', '#00CC66', '#00CC99', '#00CCCC', '#00CCFF',
    '#00FF00', '#00FF33', '#00FF66', '#00FF99', '#00FFCC', '#00FFFF',
    '#330000', '#330033', '#330066', '#330099', '#3300CC', '#3300FF',
    '#333300', '#333333', '#333366', '#333399', '#3333CC', '#3333FF',
    '#336600', '#336633', '#336666', '#336699', '#3366CC', '#3366FF',
    '#339900', '#339933', '#339966', '#339999', '#3399CC', '#3399FF',
    '#33CC00', '#33CC33', '#33CC66', '#33CC99', '#33CCCC', '#33CCFF',
    '#33FF00', '#33FF33', '#33FF66', '#33FF99', '#33FFCC', '#33FFFF',
    '#660000', '#660033', '#660066', '#660099', '#6600CC', '#6600FF',
    '#663300', '#663333', '#663366', '#663399', '#6633CC', '#6633FF',
    '#666600', '#666633', '#666666', '#666699', '#6666CC', '#6666FF',
    '#669900', '#669933', '#669966', '#669999', '#6699CC', '#6699FF',
    '#66CC00', '#66CC33', '#66CC66', '#66CC99', '#66CCCC', '#66CCFF',
    '#66FF00', '#66FF33', '#66FF66', '#66FF99', '#66FFCC', '#66FFFF',
    '#990000', '#990033', '#990066', '#990099', '#9900CC', '#9900FF',
    '#993300', '#993333', '#993366', '#993399', '#9933CC', '#9933FF',
    '#996600', '#996633', '#996666', '#996699', '#9966CC', '#9966FF',
    '#999900', '#999933', '#999966', '#999999', '#9999CC', '#9999FF',
    '#99CC00', '#99CC33', '#99CC66', '#99CC99', '#99CCCC', '#99CCFF',
    '#99FF00', '#99FF33', '#99FF66', '#99FF99', '#99FFCC', '#99FFFF',
    '#CC0000', '#CC0033', '#CC0066', '#CC0099', '#CC00CC', '#CC00FF',
    '#CC3300', '#CC3333', '#CC3366', '#CC3399', '#CC33CC', '#CC33FF',
    '#CC6600', '#CC6633', '#CC6666', '#CC6699', '#CC66CC', '#CC66FF',
    '#CC9900', '#CC9933', '#CC9966', '#CC9999', '#CC99CC', '#CC99FF',
    '#CCCC00', '#CCCC33', '#CCCC66', '#CCCC99', '#CCCCCC', '#CCCCFF',
    '#CCFF00', '#CCFF33', '#CCFF66', '#CCFF99', '#CCFFCC', '#CCFFFF',
    '#FF0000', '#FF0033', '#FF0066', '#FF0099', '#FF00CC', '#FF00FF',
    '#FF3300', '#FF3333', '#FF3366', '#FF3399', '#FF33CC', '#FF33FF',
    '#FF6600', '#FF6633', '#FF6666', '#FF6699', '#FF66CC', '#FF66FF',
    '#FF9900', '#FF9933', '#FF9966', '#FF9999', '#FF99CC', '#FF99FF',
    '#FFCC00', '#FFCC33', '#FFCC66', '#FFCC99', '#FFCCCC', '#FFCCFF',
    '#FFFF00', '#FFFF33', '#FFFF66', '#FFFF99', '#FFFFCC', '#FFFFFF'
]

# DB
mongo_link = os.getenv('MONGO_CONN_LINK')
client = MongoClient(mongo_link)
db = client.wordsearch
#wordsearch_collection = db.wordsearches
wordlist_collection = db.wordlists
all_wordlists = list(wordlist_collection.find({}))

if not all_wordlists:
  print("Error: No wordlists found in database! Something must be down."
        "\nLoading backup wordlist.")
  all_wordlists = [{
      'title':
      'Foods',
      'words':
      'Taco, hamburger, Nachos, cheesesteak, onions, fries, turkey, chicken, mustard'
  }]
else:
  print(f"Loaded {len(all_wordlists)} wordlists.")
client.close()
print('DB Connection closing.')
# Set up flask / socketio
app = Flask(__name__)
app.config['SECRET-KEY'] = os.getenv('SOCKETIO_SECRET')
socketio = SocketIO(app)


#ROUTES
@app.route('/')
def index():
  return render_template('index.html')


@app.route('/create')
def create():
  return render_template('create.html', puzzle=None)


@app.route('/play')
def redirect_to_home():
  return redirect(url_for('index'))


@app.route('/play-solo')
def play_solo():
  encoded_json = request.args.get('puzzle')
  if not encoded_json:
    return redirect(url_for('index'))

  try:
    puzzle = json.loads(urllib.parse.unquote_plus(encoded_json))
  except json.JSONDecodeError as e:
    return jsonify({'error': f'Failed to decode JSON data: {str(e)}'}), 400
  except Exception as e:
    return jsonify({'error': f'Failed to process puzzle data: {str(e)}'}), 400

  return render_template('play-solo.html', puzzle=puzzle)


@app.route('/play/<gameid>')
def play(gameid):

  if not gameid:
    return redirect('/')

  if gameid in games:
    print('loading puzzle from server mem')
    puzzle = games[gameid]['puzzle']

  else:
    return jsonify(
        {'message': "Error: Game Not Found. Your link probably has a typo."})
  #  print('retrieving puzzle from DB')
  #  db_document = wordsearch_collection.find_one({'_id': gameid})
  #  if db_document is None:
  #    return jsonify({'error': 'no matching game found in database or server memory. Please create a new game.'})
  #  puzzle = db_document['game']
  #  games[gameid] = {'players': {}, 'puzzle': puzzle, 'ready': []}

  if puzzle is None:
    return redirect('/')

  return render_template('play.html', puzzle=puzzle)


@app.route('/generate-puzzle', methods=['POST'])
def generate():
  if 'size' not in request.form or 'title' not in request.form or 'word-list' not in request.form:
    print('missing parameters.')
    return jsonify({'message': 'Error: MISSING PARAMETERS'})

  try:
    size = int(request.form['size'])
  except ValueError:
    print('size NaN')
    return jsonify({'message': 'Error: SIZE PARAMETER MUST BE A NUMBER'})

  title = request.form['title']
  word_list = request.form['word-list'].lower().split(',')

  for index in range(len(word_list)):
    word_list[index] = word_list[index].strip()

  if not any(len(word) > 2 for word in word_list):
    print('No valid words')
    return jsonify({'message': 'Error: NO VALID WORDS IN WORD LIST'})

  if title == '':
    print('No title')
    return jsonify({'message': 'Error: NO TITLE'})

  if size < 3 or size > 18:
    print('Invalid size')
    return jsonify({'message': 'Error: INVALID SIZE'})

  puzzle = Wordsearch(size)
  puzzle.title = title
  puzzle.add_wordlist(word_list)

  return jsonify(puzzle.toDict())


@app.route('/quick-play')
def quick_play():
  used_wordlist = random.choice(all_wordlists)
  title = used_wordlist['title']
  words_string = used_wordlist['words'].strip()
  words = words_string.lower().split(', ')
  puzzle = Wordsearch(14)
  puzzle.title = title
  puzzle.add_wordlist(words)
  game_id = str(uuid.uuid4())
  puzzle = puzzle.toDict()
  games[game_id] = {'players': {}, 'puzzle': puzzle, 'ready': []}
  return redirect(url_for('play', gameid=game_id))


@app.route('/quick-play-solo')
def quick_play_solo():
  used_wordlist = random.choice(all_wordlists)
  title = used_wordlist['title']
  words_string = used_wordlist['words'].strip()
  words = words_string.lower().split(', ')
  puzzle = Wordsearch(14)
  puzzle.title = title
  puzzle.add_wordlist(words)
  puzzle_data = puzzle.toDict()
  encoded_json = urllib.parse.quote_plus(json.dumps(puzzle_data))
  redirect_url = f'/play-solo?puzzle={encoded_json}'
  return redirect(redirect_url)


@app.route('/create-game', methods=['POST'])
def create_game():
  game_id = str(uuid.uuid4())
  puzzle = request.get_json()
  games[game_id] = {'players': {}, 'puzzle': puzzle, 'ready': []}
  #game = {'_id': game_id, 'game': puzzle, 'ready': []}
  #wordsearch_collection.insert_one(game)
  return redirect(url_for('play', gameid=game_id))


#Socketio listeners
@socketio.on('join_game')
def on_join(data):
  gameid = data['game_id']
  username = data['username']
  player_id = str(
      uuid.uuid4()) if 'player_id' not in data else data['player_id']
  color = random.choice(colors)
  emit('your_id', {'id': player_id, 'username': username, 'color': color})
  print(f'{username} joining game {gameid}')
  join_room(gameid)
  print(f'There are {len(games[gameid]["players"])} players in this game!')
  emit('players_in_game', {
      'players': games[gameid]['players'],
      'ready': games[gameid]['ready']
  })
  sessions_to_pids[request.sid] = player_id
  games[gameid]['players'][player_id] = {
      'id': player_id,
      'username': username,
      'color': color,
      'ready': False
  }
  emit('player_joined', {
      'id': player_id,
      'username': username,
      'color': color,
      'ready': False
  },
       room=gameid)


@socketio.on('leave_game')
def on_leave():
  pass


@socketio.on('disconnect')
def handle_disconnect():
  session_id = request.sid
  print(f'\nClient {session_id} has disconnected')
  if session_id not in sessions_to_pids:
    return
  pid = sessions_to_pids[session_id]
  removed_from = None
  # Iterate over games to find and remove the player
  for game_id, game_info in games.items():
    if pid in game_info['players']:
      del games[game_id]['players'][pid]
      emit('player_left', {'id': pid}, room=game_id)
      print(f'Player {pid} removed from game {game_id}')
      removed_from = game_id
      break
  del sessions_to_pids[session_id]
  if removed_from is not None:
    if len(games[removed_from]['players']) == 0:
      del games[removed_from]
      print(f'unloaded game {removed_from} from mem')


@socketio.on('word_found')
def handle_found_word(data):
  gameid = data['room']
  word = data['word']
  player = data['pid']
  nodes = data['nodes']
  puzzle = games[gameid]['puzzle']
  puzzle['found_words'][word] = [player, nodes]
  print(f'WORD FOUND: {word} by: {player}')
  emit('word_found', {
      'word': word,
      'pid': player,
      'nodes': nodes
  },
       room=gameid)
  if len(puzzle['found_words']) == len(puzzle['hidden_words']):
    found_words = puzzle['found_words']
    scores = {}
    for word in found_words:
      if found_words[word][0] not in scores:
        scores[found_words[word][0]] = 1
      else:
        scores[found_words[word][0]] += 1
    emit('game_over', {'scores': scores}, room=gameid)


@socketio.on('player_ready')
def handle_ready(data):
  ready_p_id = data['player']
  game_id = data['gameid']
  print(f"ID: {ready_p_id} has readied up in lobby {game_id}")
  if ready_p_id in games[game_id]['ready']:
    return
  games[game_id]['ready'].append(ready_p_id)
  games[game_id]['players'][ready_p_id]['ready'] = True
  emit('player_ready', {'player': ready_p_id}, room=game_id)
  if len(games[game_id]['players']) >= 2 and len(
      games[game_id]['ready']) >= len(games[game_id]['players']):
    emit('game_start', {}, room=game_id)


# RUN
if __name__ == '__main__':
  socketio.run(app)
