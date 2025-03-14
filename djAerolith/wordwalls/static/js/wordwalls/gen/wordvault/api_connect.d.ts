// @generated by protoc-gen-connect-es v1.4.0
// @generated from file rpc/wordvault/api.proto (package wordvault, syntax proto3)
/* eslint-disable */
// @ts-nocheck

import { AddCardsRequest, AddCardsResponse, CardCountResponse, Cards, DeleteRequest, DeleteResponse, EditFsrsParametersRequest, EditFsrsParametersResponse, EditLastScoreRequest, GetCardCountRequest, GetCardInfoRequest, GetDailyLeaderboardRequest, GetDailyLeaderboardResponse, GetDailyProgressRequest, GetDailyProgressResponse, GetFsrsParametersRequest, GetFsrsParametersResponse, GetNextScheduledRequest, GetSingleNextScheduledRequest, GetSingleNextScheduledResponse, NextScheduledBreakdown, NextScheduledCountRequest, PostponeRequest, PostponeResponse, ScoreCardRequest, ScoreCardResponse } from "./api_pb.js";
import { MethodIdempotency, MethodKind } from "@bufbuild/protobuf";

/**
 * @generated from service wordvault.WordVaultService
 */
export declare const WordVaultService: {
  readonly typeName: "wordvault.WordVaultService",
  readonly methods: {
    /**
     * @generated from rpc wordvault.WordVaultService.GetCardCount
     */
    readonly getCardCount: {
      readonly name: "GetCardCount",
      readonly I: typeof GetCardCountRequest,
      readonly O: typeof CardCountResponse,
      readonly kind: MethodKind.Unary,
      readonly idempotency: MethodIdempotency.NoSideEffects,
    },
    /**
     * @generated from rpc wordvault.WordVaultService.GetCardInformation
     */
    readonly getCardInformation: {
      readonly name: "GetCardInformation",
      readonly I: typeof GetCardInfoRequest,
      readonly O: typeof Cards,
      readonly kind: MethodKind.Unary,
      readonly idempotency: MethodIdempotency.NoSideEffects,
    },
    /**
     * @generated from rpc wordvault.WordVaultService.GetNextScheduled
     */
    readonly getNextScheduled: {
      readonly name: "GetNextScheduled",
      readonly I: typeof GetNextScheduledRequest,
      readonly O: typeof Cards,
      readonly kind: MethodKind.Unary,
      readonly idempotency: MethodIdempotency.NoSideEffects,
    },
    /**
     * @generated from rpc wordvault.WordVaultService.GetSingleNextScheduled
     */
    readonly getSingleNextScheduled: {
      readonly name: "GetSingleNextScheduled",
      readonly I: typeof GetSingleNextScheduledRequest,
      readonly O: typeof GetSingleNextScheduledResponse,
      readonly kind: MethodKind.Unary,
      readonly idempotency: MethodIdempotency.NoSideEffects,
    },
    /**
     * @generated from rpc wordvault.WordVaultService.NextScheduledCount
     */
    readonly nextScheduledCount: {
      readonly name: "NextScheduledCount",
      readonly I: typeof NextScheduledCountRequest,
      readonly O: typeof NextScheduledBreakdown,
      readonly kind: MethodKind.Unary,
    },
    /**
     * @generated from rpc wordvault.WordVaultService.ScoreCard
     */
    readonly scoreCard: {
      readonly name: "ScoreCard",
      readonly I: typeof ScoreCardRequest,
      readonly O: typeof ScoreCardResponse,
      readonly kind: MethodKind.Unary,
    },
    /**
     * @generated from rpc wordvault.WordVaultService.EditLastScore
     */
    readonly editLastScore: {
      readonly name: "EditLastScore",
      readonly I: typeof EditLastScoreRequest,
      readonly O: typeof ScoreCardResponse,
      readonly kind: MethodKind.Unary,
    },
    /**
     * @generated from rpc wordvault.WordVaultService.AddCards
     */
    readonly addCards: {
      readonly name: "AddCards",
      readonly I: typeof AddCardsRequest,
      readonly O: typeof AddCardsResponse,
      readonly kind: MethodKind.Unary,
    },
    /**
     * @generated from rpc wordvault.WordVaultService.Postpone
     */
    readonly postpone: {
      readonly name: "Postpone",
      readonly I: typeof PostponeRequest,
      readonly O: typeof PostponeResponse,
      readonly kind: MethodKind.Unary,
    },
    /**
     * @generated from rpc wordvault.WordVaultService.Delete
     */
    readonly delete: {
      readonly name: "Delete",
      readonly I: typeof DeleteRequest,
      readonly O: typeof DeleteResponse,
      readonly kind: MethodKind.Unary,
    },
    /**
     * @generated from rpc wordvault.WordVaultService.GetDailyProgress
     */
    readonly getDailyProgress: {
      readonly name: "GetDailyProgress",
      readonly I: typeof GetDailyProgressRequest,
      readonly O: typeof GetDailyProgressResponse,
      readonly kind: MethodKind.Unary,
      readonly idempotency: MethodIdempotency.NoSideEffects,
    },
    /**
     * @generated from rpc wordvault.WordVaultService.GetDailyLeaderboard
     */
    readonly getDailyLeaderboard: {
      readonly name: "GetDailyLeaderboard",
      readonly I: typeof GetDailyLeaderboardRequest,
      readonly O: typeof GetDailyLeaderboardResponse,
      readonly kind: MethodKind.Unary,
      readonly idempotency: MethodIdempotency.NoSideEffects,
    },
    /**
     * @generated from rpc wordvault.WordVaultService.GetFsrsParameters
     */
    readonly getFsrsParameters: {
      readonly name: "GetFsrsParameters",
      readonly I: typeof GetFsrsParametersRequest,
      readonly O: typeof GetFsrsParametersResponse,
      readonly kind: MethodKind.Unary,
      readonly idempotency: MethodIdempotency.NoSideEffects,
    },
    /**
     * @generated from rpc wordvault.WordVaultService.EditFsrsParameters
     */
    readonly editFsrsParameters: {
      readonly name: "EditFsrsParameters",
      readonly I: typeof EditFsrsParametersRequest,
      readonly O: typeof EditFsrsParametersResponse,
      readonly kind: MethodKind.Unary,
    },
  }
};

