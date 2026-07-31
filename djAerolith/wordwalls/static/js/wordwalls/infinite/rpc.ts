/**
 * @fileOverview JSONRPC client for the Great Wall, on top of the
 * existing GenericRPC envelope.
 */
import GenericRPC from '../generic_rpc';
import type { WallGeometry } from './geometry';

export interface WordPacket {
  w: string;
  d: string;
  fh: string;
  bh: string;
  s: string;
  ifh: boolean;
  ibh: boolean;
}

export interface QuestionPacket {
  a: string;
  ws: WordPacket[];
  g: number; // cell index on the wall
}

export type WallState = 'N' | 'R' | 'P' | 'D';

export interface WallStatus {
  state: WallState;
  elapsedMs: number;
  solvedCount: number;
  activeChunk: number | null;
}

export interface BitmapResponse extends WallStatus {
  solvedBitmap: string;
}

export interface WallDetail extends BitmapResponse, WallGeometry {
  wallId: number;
  lexicon: string;
  wordLength: number;
}

export interface ChunkResponse extends WallStatus {
  chunk: number;
  questions: QuestionPacket[];
}

export interface GuessResponse extends WallStatus {
  alphagram: string | null;
  word: string | null;
  cell?: number;
  alreadySolved: boolean;
  alphagramSolved?: boolean;
  completed?: boolean;
}

class InfiniteRPC extends GenericRPC {
  constructor(wallId: number) {
    super(`/wordwalls/infinite/${wallId}/rpc/`);
  }

  getWall(): Promise<WallDetail> {
    return this.rpcwrap('getWall', {}) as Promise<WallDetail>;
  }

  bitmap(): Promise<BitmapResponse> {
    return this.rpcwrap('bitmap', {}) as Promise<BitmapResponse>;
  }

  resume(): Promise<WallStatus> {
    return this.rpcwrap('resume', {}) as Promise<WallStatus>;
  }

  pause(): Promise<WallStatus> {
    return this.rpcwrap('pause', {}) as Promise<WallStatus>;
  }

  /** Tell the server this tab is still alive; see STALE_AFTER_SECONDS. */
  heartbeat(): Promise<WallStatus> {
    return this.rpcwrap('heartbeat', {}) as Promise<WallStatus>;
  }

  loadChunk(chunk: number): Promise<ChunkResponse> {
    return this.rpcwrap('loadChunk', { chunk }) as Promise<ChunkResponse>;
  }

  guess(chunk: number, guess: string): Promise<GuessResponse> {
    return this.rpcwrap('guess', { chunk, guess }) as Promise<GuessResponse>;
  }
}

export default InfiniteRPC;
