import random
from urllib import parse


class Wordsearch:

  def __init__(self, size):
    self.size = int(size)
    self.grid = [['0' for x in range(size)] for x in range(size)]
    self.hidden_words = []
    self.found_words = {}
    self.title = ''

  def __str__(self):
    grid_str = ''
    for row in self.grid:
      for letter in row:
        grid_str += f'{letter} '
      grid_str += '<br>'
    return grid_str

  def add_wordlist(self, wordlist):
    successfully_added = []
    for word in wordlist:
      if len(word) <= 2:
        continue
      if any(word_obj['word'] == word for word_obj in self.hidden_words):
        continue
      word = word.replace(',', '').replace('  ', '').replace('.', '').replace(
          '-', '').replace('_', '').replace(' ', '')
      starting_pos = self._addword(word)
      if starting_pos:
        self.hidden_words.append({'word': word, 'pos': starting_pos})
        successfully_added.append(word)
    self._fill()
    return successfully_added

  def toDict(self):
    """Returns a dict of the grid, size, and hidden_words"""
    return {
        'grid': self.grid,
        'size': self.size,
        'hidden_words': self.hidden_words,
        'title': self.title or '-',
        'found_words': self.found_words
    }

  def _addword(self, word):
    if len(word) > self.size or len(word) < 2:
      return False
    placements = "hvde"
    placement = random.choice(placements)
    direction = random.choice('fffbf')
    if direction == 'b':
      word = word[::-1]
    successful = False
    if placement == 'h':
      successful = self._add_horizontal(word)
    elif placement == 'v':
      successful = self._add_vertical(word)
    elif placement == 'd':
      successful = self._add_diagonal(word)
    elif placement == 'e':
      successful = self._add_word_from_existing(word)
    return successful

  def _add_horizontal(self, word):
    word_len = len(word)
    rows_with_space = self._find_rows_with_gap(word, self.grid)
    row_indexes = list(rows_with_space)
    if len(row_indexes) == 0:
      return False
    elif len(row_indexes) == 1:
      chosen_row = row_indexes[0]
    else:
      chosen_row = random.choice(row_indexes)
    row_index, gap_start, gap_end = rows_with_space[chosen_row]
    #print(f'ADDING {word} TO ROW {row_index} WITH GAP START {gap_start} AND GAP END {gap_end}')
    #Leaving this print statement indefinitely because its proven extremely useful for several different bugs already, and who knows. try this if this area breaks.
    if gap_end - (word_len - 1) == gap_start:
      starting_index = gap_start
    else:
      starting_index = random.randint(gap_start, gap_end - (word_len - 1))
    starting_letter_pos = (row_index, starting_index)
    for letter in word:
      self.grid[row_index][starting_index] = letter
      starting_index += 1
    return starting_letter_pos

  def _find_rows_with_gap(self, word: str, grid):
    rows = {}
    length = len(word)
    for index, row in enumerate(grid):
      max_gap = 0
      max_start = -9
      current_gap = 0
      current_start = -9  #Initializing this to a value our index will never be
      for char_index, char in enumerate(row):
        if char == '0':  # or word[current_gap+1] == char: IMPLEMENT FOR GOODNESS SAKE
          current_gap += 1
          if current_start == -9:  #If we haven't yet started a 'gap'
            current_start = char_index  #This is our start
        else:
          current_gap = 0
          if current_start != -9:  #If this is the end of our gap
            current_start = -9
        if current_gap > max_gap:
          max_gap = current_gap
          max_start = current_start
      #print(f'Row {index} has a max gap of {max_gap} starting at index {max_start} and ending at {max_end}')
      if max_gap >= length:
        rows[index] = (index, max_start, max_start + max_gap - 1)
    return rows

  def _find_diags_with_gap(self, word: str, grid):
    diags = {}
    length = len(word)
    for index, row in enumerate(grid):
      max_gap = 0
      max_start = -9
      current_gap = 0
      current_start = -9  #Initializing this to a value our index will never be
      for (char, row, col) in row:
        if char == '0':  # or word[current_gap+1] == char: IMPLEMENT FOR GOODNESS SAKE
          current_gap += 1
          if current_start == -9:  #If we haven't yet started a 'gap'
            current_start = (row, col)  #This is our start
        else:
          current_gap = 0
          if current_start != -9:  #If this is the end of our gap
            current_start = -9
        if current_gap > max_gap:
          max_gap = current_gap
          max_start = current_start
      #print(f'Row {index} has a max gap of {max_gap} starting at index {max_start} and ending at {max_end}')
      if max_gap >= length:
        diags[index] = (index, max_start, max_gap)
    return diags

  def _add_vertical(self, word):
    word_len = len(word)
    grid = self._transposed_grid()
    cols_with_spaces = self._find_rows_with_gap(word, grid)
    col_indexes = list(cols_with_spaces)
    if len(col_indexes) == 0:
      return False
    elif len(col_indexes) == 1:
      chosen_col = col_indexes[0]
    else:
      chosen_col = random.choice(col_indexes)
    col_index, gap_start, gap_end = cols_with_spaces[chosen_col]

    if gap_end - (word_len - 1) == gap_start:
      starting_index = gap_start
    else:
      starting_index = random.randint(gap_start, gap_end - (word_len - 1))
    starting_letter_pos = (starting_index, col_index)
    for letter in word:
      self.grid[starting_index][col_index] = letter
      starting_index += 1
    return starting_letter_pos

  def _add_diagonal(self, word):
    word_len = len(word)
    grid, directions = self._transpose_diagonal()
    diags_with_space = self._find_diags_with_gap(word, grid)
    options = list(diags_with_space)
    if len(options) == 0:
      return False
    elif len(options) == 1:
      chosen_diag = options[0]
    else:
      chosen_diag = random.choice(options)
    direction = directions[chosen_diag]
    index, start, gap_size = diags_with_space[chosen_diag]
    if direction == 'L':
      nodes = [(start[0] + x, start[1] - x) for x in range(gap_size)]
    else:
      nodes = [(start[0] + x, start[1] + x) for x in range(gap_size)]
    if len(nodes) - (word_len - 1) == 1:
      starting_node = 0
    else:
      starting_node = random.randint(0, len(nodes) - (word_len - 1) - 1)
    #POSITION OF STARTING LETTER#
    starting_letter_pos = (nodes[starting_node][0], nodes[starting_node][1]
                           )  # (Row, Col)

    for letter in word:
      row = nodes[starting_node][0]
      col = nodes[starting_node][1]
      self.grid[row][col] = letter
      starting_node += 1
    return starting_letter_pos

  def _transposed_grid(self):
    grid_transposed = []
    for col_index in range(self.size):
      col = [self.grid[x][col_index] for x in range(self.size)]
      grid_transposed.append(col)
    return grid_transposed

  def _transpose_diagonal(self):
    grid_transposed = []
    visited = {}
    directions = {}
    current_node = (self.size - 2, 0)
    while current_node:
      visited[current_node] = True
      diagonal_right = self._diag_right(current_node)
      diagonal_left = self._diag_left(current_node)
      if diagonal_right:
        directions[len(grid_transposed)] = 'R'
        grid_transposed.append(diagonal_right)
      if diagonal_left:
        directions[len(grid_transposed)] = 'L'
        grid_transposed.append(diagonal_left)
      current_node = self._next_diag_start(current_node)
    return grid_transposed, directions

  def _diag_right(self, node, letters=None):
    if node[1] == self.size - 1:
      return None  # We will never have a right diag child starting from the right edge
    if letters is None:
      letters = []
      letter = self.grid[node[0]][node[1]]
      letters.append((letter, node[0], node[1]))
    try:
      child = self.grid[node[0] + 1][node[1] + 1]
    except IndexError:
      return
    else:
      letters.append((child, node[0] + 1, node[1] + 1))
      self._diag_right((node[0] + 1, node[1] + 1), letters)
    if len(letters) == 1:
      letters = None
    return letters

  def _diag_left(self, node, letters=None):
    if node[1] == 0:
      return None  # We will never have a left diag child from the left edge
    if letters is None:
      letters = []
      letter = self.grid[node[0]][node[1]]
      letters.append((letter, node[0], node[1]))
    try:
      child = self.grid[node[0] + 1][node[1] - 1]
    except IndexError:
      return
    else:
      letters.append((child, node[0] + 1, node[1] - 1))
      self._diag_left((node[0] + 1, node[1] - 1), letters)
    if len(letters) == 1:
      letters = None
    return letters

  def _next_diag_start(self, node):
    if node[
        1] == 0:  #If we're along the left edge of the grid, we either need a neighbor to the top or right
      if node[0] == 0:  #If we're in the top left corner, go right!
        return (node[0], node[1] + 1)
      else:  #Otherwise, go up!
        return (node[0] - 1, node[1])
    if node[
        0] == 0:  #If we're along the top edge of the grid, we either need a neighbor to the right or below
      if node[1] == self.size - 1:  #If we're in the top right corner, go down!
        return (node[0] + 1, node[1])
      else:  #Otherwise, go to the right!
        return (node[0], node[1] + 1)
    if node[
        1] == self.size - 1:  # If we're along the bottom edge of the grid we need a neighbor below
      if node[0] + 1 > self.size - 2:  #If we're at the last node in our U shape
        return None
      else:
        return (node[0] + 1, node[1])

  def _add_word_from_existing(self, word):
    word_len = len(word)
    rows_with_letters = {}
    for row_index, row in enumerate(self.grid):
      for col_index, char in enumerate(row):
        if char in word:
          rows_with_letters[(row_index, col_index)] = char

    for (row, col), letter in rows_with_letters.items():
      neighbors = self._find_suitable_neighbors(row, col, word)
      if neighbors:
        start_pos = self._place_word(neighbors, word)
        return start_pos

    return False

  def _find_suitable_neighbors(self, row, col, word):
    directions = [(0, 1), (0, -1), (1, 0), (-1, 0), (1, 1), (1, -1), (-1, 1),
                  (-1, -1)]
    for dx, dy in directions:
      if self._can_place_word(row, col, dx, dy, word):
        return (row, col, dx, dy)
    return None

  def _can_place_word(self, row, col, dx, dy, word):
    word_len = len(word)
    for i in range(word_len):
      new_row = row + i * dx
      new_col = col + i * dy
      if not (0 <= new_row < self.size and 0 <= new_col < self.size):
        return False
      if self.grid[new_row][new_col] not in ['0', word[i]]:
        return False
    return True

  def _place_word(self, start_pos, word):
    row, col, dx, dy = start_pos
    starting_letter_pos = (row, col)
    for letter in word:
      self.grid[row][col] = letter
      row += dx
      col += dy
    return starting_letter_pos

  def _fill(self):
    for index, row in enumerate(self.grid):
      for char_index, char in enumerate(row):
        if char == '0':
          self.grid[index][char_index] = random.choice(
              'abcdefghijklmnopqrstuvwxyz')
