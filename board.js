class ChessPiece {
  constructor(kind, player) {
    this.kind = kind;
    this.player = player;
  }
}

class Board {
  constructor() {
    this.fields = Array(8).fill(null).map(() => Array(8).fill(null));
    this.whiteKingMoved = false;
    this.blackKingMoved = false;
    this.whiteRooksMoved = [false, false]; // [kingside, queenside]
    this.blackRooksMoved = [false, false]; // [kingside, queenside]
    this.enPassantTarget = null;
    this.initializeBoard();
  }

  initializeBoard() {
    // Place pawns
    for (let i = 0; i < 8; i++) {
      this.fields[1][i] = new ChessPiece('pawn', 'black');
      this.fields[6][i] = new ChessPiece('pawn', 'white');
    }

    // Place other pieces
    const pieceOrder = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];

    for (let i = 0; i < 8; i++) {
      this.fields[0][i] = new ChessPiece(pieceOrder[i], 'black');
      this.fields[7][i] = new ChessPiece(pieceOrder[i], 'white');
    }
  }

  getPiece(row, col) {
    return this.fields[row][col];
  }

  setPiece(row, col, piece) {
    this.fields[row][col] = piece;
  }

  movePiece(fromRow, fromCol, toRow, toCol) {
    const piece = this.getPiece(fromRow, fromCol);
    if (!piece) return false;

    // Handle castling
    if (piece.kind === 'king' && Math.abs(toCol - fromCol) === 2) {
      if (this.canCastle(piece.player, toCol > fromCol)) {
        this.performCastling(piece.player, toCol > fromCol);
        this.enPassantTarget = null;
        return true;
      }
      return false;
    }

    // Check if move is valid
    if (!this.isValidMove(piece, fromRow, fromCol, toRow, toCol)) return false;

    // Handle en passant capture
    if (piece.kind === 'pawn' && this.enPassantTarget &&
        toRow === this.enPassantTarget.row && toCol === this.enPassantTarget.col) {
      const capturedPawnRow = piece.player === 'white' ? toRow + 1 : toRow - 1;
      this.setPiece(capturedPawnRow, toCol, null);
    }

    // Move piece
    this.setPiece(toRow, toCol, piece);
    this.setPiece(fromRow, fromCol, null);

    // Handle pawn promotion
    if (piece.kind === 'pawn' && ((piece.player === 'white' && toRow === 0) || (piece.player === 'black' && toRow === 7))) {
      this.setPiece(toRow, toCol, new ChessPiece('queen', piece.player));
    }

    // Track piece movements for castling
    if (piece.kind === 'king') {
      if (piece.player === 'white') this.whiteKingMoved = true;
      else this.blackKingMoved = true;
    } else if (piece.kind === 'rook') {
      if (piece.player === 'white') {
        if (fromCol === 0) this.whiteRooksMoved[1] = true;
        else if (fromCol === 7) this.whiteRooksMoved[0] = true;
      } else {
        if (fromCol === 0) this.blackRooksMoved[1] = true;
        else if (fromCol === 7) this.blackRooksMoved[0] = true;
      }
    }

    // Set en passant target
    if (piece.kind === 'pawn' && Math.abs(toRow - fromRow) === 2) {
      this.enPassantTarget = { row: piece.player === 'white' ? toRow + 1 : toRow - 1, col: toCol };
    } else {
      this.enPassantTarget = null;
    }

    return true;
  }

  isValidMove(piece, fromRow, fromCol, toRow, toCol) {
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);
    const targetPiece = this.getPiece(toRow, toCol);

    if (fromRow === toRow && fromCol === toCol) return false;
    if (targetPiece && targetPiece.player === piece.player) return false;

    switch (piece.kind) {
      case 'pawn': return this.isValidPawnMove(piece, fromRow, fromCol, toRow, toCol);
      case 'rook': return this.isValidRookMove(fromRow, fromCol, toRow, toCol);
      case 'knight': return this.isValidKnightMove(fromRow, fromCol, toRow, toCol);
      case 'bishop': return this.isValidBishopMove(fromRow, fromCol, toRow, toCol);
      case 'queen': return this.isValidQueenMove(fromRow, fromCol, toRow, toCol);
      case 'king': return this.isValidKingMove(fromRow, fromCol, toRow, toCol);
      default: return false;
    }
  }

  isValidPawnMove(piece, fromRow, fromCol, toRow, toCol) {
    const direction = piece.player === 'white' ? -1 : 1;
    const startRow = piece.player === 'white' ? 6 : 1;
    const rowDiff = toRow - fromRow;
    const colDiff = Math.abs(toCol - fromCol);

    if (colDiff === 0 && !this.getPiece(toRow, toCol)) {
      if (rowDiff === direction) return true;
      if (fromRow === startRow && rowDiff === 2 * direction) return true;
    }

    if (colDiff === 1 && rowDiff === direction) {
      const targetPiece = this.getPiece(toRow, toCol);
      if (targetPiece) return true;
      if (this.enPassantTarget && toRow === this.enPassantTarget.row && toCol === this.enPassantTarget.col) return true;
    }

    return false;
  }

  isValidRookMove(fromRow, fromCol, toRow, toCol) {
    if (fromRow !== toRow && fromCol !== toCol) return false;
    return this.isPathClear(fromRow, fromCol, toRow, toCol);
  }

  isValidKnightMove(fromRow, fromCol, toRow, toCol) {
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);
    return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
  }

  isValidBishopMove(fromRow, fromCol, toRow, toCol) {
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);
    if (rowDiff !== colDiff) return false;
    return this.isPathClear(fromRow, fromCol, toRow, toCol);
  }

  isValidQueenMove(fromRow, fromCol, toRow, toCol) {
    return this.isValidRookMove(fromRow, fromCol, toRow, toCol) || this.isValidBishopMove(fromRow, fromCol, toRow, toCol);
  }

  isValidKingMove(fromRow, fromCol, toRow, toCol) {
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);
    return rowDiff <= 1 && colDiff <= 1;
  }

  isPathClear(fromRow, fromCol, toRow, toCol) {
    const rowStep = fromRow < toRow ? 1 : fromRow > toRow ? -1 : 0;
    const colStep = fromCol < toCol ? 1 : fromCol > toCol ? -1 : 0;
    let currentRow = fromRow + rowStep;
    let currentCol = fromCol + colStep;
    while (currentRow !== toRow || currentCol !== toCol) {
      if (this.getPiece(currentRow, currentCol)) return false;
      currentRow += rowStep;
      currentCol += colStep;
    }
    return true;
  }

  getValidMoves(row, col) {
    const piece = this.getPiece(row, col);
    if (!piece) return [];
    const validMoves = [];
    for (let toRow = 0; toRow < 8; toRow++) {
      for (let toCol = 0; toCol < 8; toCol++) {
        if (this.isValidMove(piece, row, col, toRow, toCol)) {
          // Check if this move would leave king in check
          const testBoard = this.copy();
          testBoard.movePiece(row, col, toRow, toCol);
          if (!testBoard.isInCheck(piece.player)) {
            validMoves.push({ row: toRow, col: toCol });
          }
        }
      }
    }
    if (piece.kind === 'king') {
      if (this.canCastle(piece.player, true)) validMoves.push({ row, col: 6 });
      if (this.canCastle(piece.player, false)) validMoves.push({ row, col: 2 });
    }
    return validMoves;
  }

  isSquareUnderAttack(row, col, byPlayer) {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = this.getPiece(r, c);
        if (piece && piece.player === byPlayer && this.isValidMove(piece, r, c, row, col)) {
          return true;
        }
      }
    }
    return false;
  }

  isInCheck(player) {
    let kingRow = -1, kingCol = -1;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = this.getPiece(r, c);
        if (piece && piece.kind === 'king' && piece.player === player) {
          kingRow = r;
          kingCol = c;
          break;
        }
      }
      if (kingRow !== -1) break;
    }
    if (kingRow === -1) return false;
    const opponent = player === 'white' ? 'black' : 'white';
    return this.isSquareUnderAttack(kingRow, kingCol, opponent);
  }

  isCheckmate(player) {
    if (!this.isInCheck(player)) return false;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = this.getPiece(r, c);
        if (piece && piece.player === player) {
          const moves = this.getValidMoves(r, c);
          for (const move of moves) {
            const capturedPiece = this.getPiece(move.row, move.col);
            this.setPiece(move.row, move.col, piece);
            this.setPiece(r, c, null);
            const stillInCheck = this.isInCheck(player);
            this.setPiece(r, c, piece);
            this.setPiece(move.row, move.col, capturedPiece);
            if (!stillInCheck) return false;
          }
        }
      }
    }
    return true;
  }

  canCastle(player, kingside) {
    if (this.isInCheck(player)) return false;
    const row = player === 'white' ? 7 : 0;
    const kingCol = 4;
    if (player === 'white') {
      if (this.whiteKingMoved) return false;
      if (kingside && this.whiteRooksMoved[0]) return false;
      if (!kingside && this.whiteRooksMoved[1]) return false;
    } else {
      if (this.blackKingMoved) return false;
      if (kingside && this.blackRooksMoved[0]) return false;
      if (!kingside && this.blackRooksMoved[1]) return false;
    }
    const startCol = Math.min(kingCol, kingside ? 7 : 0) + 1;
    const endCol = Math.max(kingCol, kingside ? 7 : 0) - 1;
    for (let c = startCol; c <= endCol; c++) {
      if (this.getPiece(row, c)) return false;
    }
    const direction = kingside ? 1 : -1;
    for (let c = kingCol; c !== kingCol + 2 * direction; c += direction) {
      if (this.isSquareUnderAttack(row, c, player === 'white' ? 'black' : 'white')) return false;
    }
    return true;
  }

  performCastling(player, kingside) {
    const row = player === 'white' ? 7 : 0;
    const kingCol = 4;
    const newKingCol = kingside ? 6 : 2;
    const rookCol = kingside ? 7 : 0;
    const newRookCol = kingside ? 5 : 3;
    const king = this.getPiece(row, kingCol);
    const rook = this.getPiece(row, rookCol);
    if (king && rook) {
      this.setPiece(row, newKingCol, king);
      this.setPiece(row, newRookCol, rook);
      this.setPiece(row, kingCol, null);
      this.setPiece(row, rookCol, null);
      if (player === 'white') {
        this.whiteKingMoved = true;
        if (kingside) this.whiteRooksMoved[0] = true;
        else this.whiteRooksMoved[1] = true;
      } else {
        this.blackKingMoved = true;
        if (kingside) this.blackRooksMoved[0] = true;
        else this.blackRooksMoved[1] = true;
      }
    }
  }

  copy() {
    const newBoard = new Board();
    newBoard.fields = this.fields.map(row => row.map(piece => piece ? new ChessPiece(piece.kind, piece.player) : null));
    newBoard.whiteKingMoved = this.whiteKingMoved;
    newBoard.blackKingMoved = this.blackKingMoved;
    newBoard.whiteRooksMoved = [...this.whiteRooksMoved];
    newBoard.blackRooksMoved = [...this.blackRooksMoved];
    newBoard.enPassantTarget = this.enPassantTarget ? { ...this.enPassantTarget } : null;
    return newBoard;
  }
}

module.exports = { Board };
