export interface ChessPiece {
  kind: 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
  player: 'white' | 'black';
}

export class Board {
  fields: (ChessPiece | null)[][];
  whiteKingMoved: boolean = false;
  blackKingMoved: boolean = false;
  whiteRooksMoved: boolean[] = [false, false]; // [kingside, queenside]
  blackRooksMoved: boolean[] = [false, false]; // [kingside, queenside]
  enPassantTarget: {row: number, col: number} | null = null;

  constructor() {
    this.fields = Array(8).fill(null).map(() => Array(8).fill(null));
    this.initializeBoard();
  }

  private initializeBoard() {
    // Place pawns
    for (let i = 0; i < 8; i++) {
      this.fields[1][i] = { kind: 'pawn', player: 'black' };
      this.fields[6][i] = { kind: 'pawn', player: 'white' };
    }

    // Place other pieces
    const pieceOrder: ('rook' | 'knight' | 'bishop' | 'queen' | 'king' | 'bishop' | 'knight' | 'rook')[] = [
      'rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'
    ];

    for (let i = 0; i < 8; i++) {
      this.fields[0][i] = { kind: pieceOrder[i], player: 'black' };
      this.fields[7][i] = { kind: pieceOrder[i], player: 'white' };
    }
  }

  getPiece(row: number, col: number): ChessPiece | null {
    return this.fields[row][col];
  }

  setPiece(row: number, col: number, piece: ChessPiece | null) {
    this.fields[row][col] = piece;
  }

  movePiece(fromRow: number, fromCol: number, toRow: number, toCol: number): boolean {
    const piece = this.getPiece(fromRow, fromCol);
    if (!piece) return false;

    // Handle castling
    if (piece.kind === 'king' && Math.abs(toCol - fromCol) === 2) {
      const kingside = toCol > fromCol;
      if (this.canCastle(piece.player, kingside)) {
        this.performCastling(piece.player, kingside);
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
      // Remove the captured pawn
      const capturedPawnRow = piece.player === 'white' ? toRow + 1 : toRow - 1;
      this.setPiece(capturedPawnRow, toCol, null);
    }

    // Move piece
    this.setPiece(toRow, toCol, piece);
    this.setPiece(fromRow, fromCol, null);

    // Handle pawn promotion
    if (piece.kind === 'pawn' && ((piece.player === 'white' && toRow === 0) || (piece.player === 'black' && toRow === 7))) {
      // Promote to queen for simplicity
      this.setPiece(toRow, toCol, { kind: 'queen', player: piece.player });
    }

    // Track piece movements for castling
    if (piece.kind === 'king') {
      if (piece.player === 'white') this.whiteKingMoved = true;
      else this.blackKingMoved = true;
    } else if (piece.kind === 'rook') {
      if (piece.player === 'white') {
        if (fromCol === 0) this.whiteRooksMoved[1] = true; // queenside
        else if (fromCol === 7) this.whiteRooksMoved[0] = true; // kingside
      } else {
        if (fromCol === 0) this.blackRooksMoved[1] = true; // queenside
        else if (fromCol === 7) this.blackRooksMoved[0] = true; // kingside
      }
    }

    // Set en passant target for double pawn moves
    if (piece.kind === 'pawn' && Math.abs(toRow - fromRow) === 2) {
      this.enPassantTarget = { row: piece.player === 'white' ? toRow + 1 : toRow - 1, col: toCol };
    } else {
      this.enPassantTarget = null;
    }

    return true;
  }

  isValidMove(piece: ChessPiece, fromRow: number, fromCol: number, toRow: number, toCol: number): boolean {
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);
    const targetPiece = this.getPiece(toRow, toCol);

    // Can't move to same position
    if (fromRow === toRow && fromCol === toCol) return false;

    // Can't capture own piece
    if (targetPiece && targetPiece.player === piece.player) return false;

    switch (piece.kind) {
      case 'pawn':
        return this.isValidPawnMove(piece, fromRow, fromCol, toRow, toCol);
      case 'rook':
        return this.isValidRookMove(fromRow, fromCol, toRow, toCol);
      case 'knight':
        return this.isValidKnightMove(fromRow, fromCol, toRow, toCol);
      case 'bishop':
        return this.isValidBishopMove(fromRow, fromCol, toRow, toCol);
      case 'queen':
        return this.isValidQueenMove(fromRow, fromCol, toRow, toCol);
      case 'king':
        return this.isValidKingMove(fromRow, fromCol, toRow, toCol);
      default:
        return false;
    }
  }

  private isValidPawnMove(piece: ChessPiece, fromRow: number, fromCol: number, toRow: number, toCol: number): boolean {
    const direction = piece.player === 'white' ? -1 : 1;
    const startRow = piece.player === 'white' ? 6 : 1;
    const rowDiff = toRow - fromRow;
    const colDiff = Math.abs(toCol - fromCol);

    // Forward move
    if (colDiff === 0 && !this.getPiece(toRow, toCol)) {
      if (rowDiff === direction) return true; // Single move
      if (fromRow === startRow && rowDiff === 2 * direction) return true; // Double move from start
    }

    // Capture diagonally (including en passant)
    if (colDiff === 1 && rowDiff === direction) {
      const targetPiece = this.getPiece(toRow, toCol);
      if (targetPiece) return true; // Regular capture

      // En passant capture
      if (this.enPassantTarget &&
          toRow === this.enPassantTarget.row && toCol === this.enPassantTarget.col) {
        return true;
      }
    }

    return false;
  }

  private isValidRookMove(fromRow: number, fromCol: number, toRow: number, toCol: number): boolean {
    // Rook moves horizontally or vertically
    if (fromRow !== toRow && fromCol !== toCol) return false;

    // Check if path is clear
    return this.isPathClear(fromRow, fromCol, toRow, toCol);
  }

  private isValidKnightMove(fromRow: number, fromCol: number, toRow: number, toCol: number): boolean {
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);

    // L-shape: 2 in one direction, 1 in perpendicular
    return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
  }

  private isValidBishopMove(fromRow: number, fromCol: number, toRow: number, toCol: number): boolean {
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);

    // Bishop moves diagonally
    if (rowDiff !== colDiff) return false;

    // Check if path is clear
    return this.isPathClear(fromRow, fromCol, toRow, toCol);
  }

  private isValidQueenMove(fromRow: number, fromCol: number, toRow: number, toCol: number): boolean {
    // Queen combines rook and bishop moves
    return this.isValidRookMove(fromRow, fromCol, toRow, toCol) || this.isValidBishopMove(fromRow, fromCol, toRow, toCol);
  }

  private isValidKingMove(fromRow: number, fromCol: number, toRow: number, toCol: number): boolean {
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);

    // King moves one square in any direction
    return rowDiff <= 1 && colDiff <= 1;
  }

  private isPathClear(fromRow: number, fromCol: number, toRow: number, toCol: number): boolean {
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

  getValidMoves(row: number, col: number): {row: number, col: number}[] {
    const piece = this.getPiece(row, col);
    if (!piece) return [];

    const validMoves: {row: number, col: number}[] = [];

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

    // Add castling moves for king
    if (piece.kind === 'king') {
      // Kingside castling
      if (this.canCastle(piece.player, true)) {
        validMoves.push({ row, col: 6 });
      }
      // Queenside castling
      if (this.canCastle(piece.player, false)) {
        validMoves.push({ row, col: 2 });
      }
    }

    return validMoves;
  }

  isSquareUnderAttack(row: number, col: number, byPlayer: 'white' | 'black'): boolean {
    // Check if any enemy piece can attack this square
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = this.getPiece(r, c);
        if (piece && piece.player === byPlayer) {
          if (this.isValidMove(piece, r, c, row, col)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  isInCheck(player: 'white' | 'black'): boolean {
    // Find the king
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

    if (kingRow === -1) return false; // King not found (shouldn't happen)

    const opponent = player === 'white' ? 'black' : 'white';
    return this.isSquareUnderAttack(kingRow, kingCol, opponent);
  }

  isCheckmate(player: 'white' | 'black'): boolean {
    if (!this.isInCheck(player)) return false;

    // Check if any move can get out of check
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = this.getPiece(r, c);
        if (piece && piece.player === player) {
          const moves = this.getValidMoves(r, c);
          for (const move of moves) {
            // Try the move and see if king is still in check
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

  canCastle(player: 'white' | 'black', kingside: boolean): boolean {
    if (this.isInCheck(player)) return false;

    const row = player === 'white' ? 7 : 0;
    const kingCol = 4;
    const rookCol = kingside ? 7 : 0;

    // Check if king and rook haven't moved
    if (player === 'white') {
      if (this.whiteKingMoved) return false;
      if (kingside && this.whiteRooksMoved[0]) return false;
      if (!kingside && this.whiteRooksMoved[1]) return false;
    } else {
      if (this.blackKingMoved) return false;
      if (kingside && this.blackRooksMoved[0]) return false;
      if (!kingside && this.blackRooksMoved[1]) return false;
    }

    // Check if squares between king and rook are empty
    const startCol = Math.min(kingCol, rookCol) + 1;
    const endCol = Math.max(kingCol, rookCol) - 1;
    for (let c = startCol; c <= endCol; c++) {
      if (this.getPiece(row, c)) return false;
    }

    // Check if king passes through check
    const direction = kingside ? 1 : -1;
    for (let c = kingCol; c !== kingCol + 2 * direction; c += direction) {
      if (this.isSquareUnderAttack(row, c, player === 'white' ? 'black' : 'white')) {
        return false;
      }
    }

    return true;
  }

  performCastling(player: 'white' | 'black', kingside: boolean): void {
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

      // Mark pieces as moved
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

  copy(): Board {
    const newBoard = new Board();
    newBoard.fields = this.fields.map(row => row.map(piece => piece ? { ...piece } : null));
    newBoard.whiteKingMoved = this.whiteKingMoved;
    newBoard.blackKingMoved = this.blackKingMoved;
    newBoard.whiteRooksMoved = [...this.whiteRooksMoved];
    newBoard.blackRooksMoved = [...this.blackRooksMoved];
    newBoard.enPassantTarget = this.enPassantTarget ? { ...this.enPassantTarget } : null;
    return newBoard;
  }
}
