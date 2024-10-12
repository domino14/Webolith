# -*- coding: utf-8 -*-
# Generated by the protocol buffer compiler.  DO NOT EDIT!
# NO CHECKED-IN PROTOBUF GENCODE
# source: rpc/wordvault/api.proto
# Protobuf Python Version: 5.28.1
"""Generated protocol buffer code."""
from google.protobuf import descriptor as _descriptor
from google.protobuf import descriptor_pool as _descriptor_pool
from google.protobuf import runtime_version as _runtime_version
from google.protobuf import symbol_database as _symbol_database
from google.protobuf.internal import builder as _builder
_runtime_version.ValidateProtobufRuntimeVersion(
    _runtime_version.Domain.PUBLIC,
    5,
    28,
    1,
    '',
    'rpc/wordvault/api.proto'
)
# @@protoc_insertion_point(imports)

_sym_db = _symbol_database.Default()


from google.protobuf import timestamp_pb2 as google_dot_protobuf_dot_timestamp__pb2
from rpc.wordsearcher import searcher_pb2 as rpc_dot_wordsearcher_dot_searcher__pb2


DESCRIPTOR = _descriptor_pool.Default().AddSerializedFile(b'\n\x17rpc/wordvault/api.proto\x12\twordvault\x1a\x1fgoogle/protobuf/timestamp.proto\x1a\x1frpc/wordsearcher/searcher.proto\"\xc4\x01\n\x04\x43\x61rd\x12\x18\n\x07lexicon\x18\x01 \x01(\tR\x07lexicon\x12\x35\n\talphagram\x18\x02 \x01(\x0b\x32\x17.wordsearcher.AlphagramR\talphagram\x12$\n\x0e\x63\x61rd_json_repr\x18\x03 \x01(\x0cR\x0c\x63\x61rdJsonRepr\x12&\n\x0eretrievability\x18\x04 \x01(\x01R\x0eretrievability\x12\x1d\n\nreview_log\x18\x05 \x01(\x0cR\treviewLog\"N\n\x12GetCardInfoRequest\x12\x18\n\x07lexicon\x18\x01 \x01(\tR\x07lexicon\x12\x1e\n\nalphagrams\x18\x02 \x03(\tR\nalphagrams\"I\n\x17GetNextScheduledRequest\x12\x18\n\x07lexicon\x18\x01 \x01(\tR\x07lexicon\x12\x14\n\x05limit\x18\x02 \x01(\rR\x05limit\".\n\x05\x43\x61rds\x12%\n\x05\x63\x61rds\x18\x01 \x03(\x0b\x32\x0f.wordvault.CardR\x05\x63\x61rds\"r\n\x10ScoreCardRequest\x12&\n\x05score\x18\x01 \x01(\x0e\x32\x10.wordvault.ScoreR\x05score\x12\x18\n\x07lexicon\x18\x02 \x01(\tR\x07lexicon\x12\x1c\n\talphagram\x18\x03 \x01(\tR\talphagram\"|\n\x11ScoreCardResponse\x12\x41\n\x0enext_scheduled\x18\x01 \x01(\x0b\x32\x1a.google.protobuf.TimestampR\rnextScheduled\x12$\n\x0e\x63\x61rd_json_repr\x18\x02 \x01(\x0cR\x0c\x63\x61rdJsonRepr\"K\n\x0f\x41\x64\x64\x43\x61rdsRequest\x12\x18\n\x07lexicon\x18\x01 \x01(\tR\x07lexicon\x12\x1e\n\nalphagrams\x18\x02 \x03(\tR\nalphagrams\":\n\x10\x41\x64\x64\x43\x61rdsResponse\x12&\n\x0fnum_cards_added\x18\x01 \x01(\rR\rnumCardsAdded\"\xa3\x01\n\x14\x45\x64itLastScoreRequest\x12\x18\n\x07lexicon\x18\x01 \x01(\tR\x07lexicon\x12\x1c\n\talphagram\x18\x02 \x01(\tR\talphagram\x12-\n\tnew_score\x18\x03 \x01(\x0e\x32\x10.wordvault.ScoreR\x08newScore\x12$\n\x0elast_card_repr\x18\x04 \x01(\x0cR\x0clastCardRepr\"\x15\n\x13GetCardCountRequest\"\xba\x01\n\x11\x43\x61rdCountResponse\x12G\n\tnum_cards\x18\x01 \x03(\x0b\x32*.wordvault.CardCountResponse.NumCardsEntryR\x08numCards\x12\x1f\n\x0btotal_cards\x18\x02 \x01(\rR\ntotalCards\x1a;\n\rNumCardsEntry\x12\x10\n\x03key\x18\x01 \x01(\tR\x03key\x12\x14\n\x05value\x18\x02 \x01(\rR\x05value:\x02\x38\x01\"t\n\x19NextScheduledCountRequest\x12!\n\x0conly_overdue\x18\x01 \x01(\x08R\x0bonlyOverdue\x12\x1a\n\x08timezone\x18\x02 \x01(\tR\x08timezone\x12\x18\n\x07lexicon\x18\x03 \x01(\tR\x07lexicon\"\xa6\x01\n\x16NextScheduledBreakdown\x12N\n\tbreakdown\x18\x01 \x03(\x0b\x32\x30.wordvault.NextScheduledBreakdown.BreakdownEntryR\tbreakdown\x1a<\n\x0e\x42reakdownEntry\x12\x10\n\x03key\x18\x01 \x01(\tR\x03key\x12\x14\n\x05value\x18\x02 \x01(\rR\x05value:\x02\x38\x01\"S\n\x0fPostponeRequest\x12\x18\n\x07lexicon\x18\x01 \x01(\tR\x07lexicon\x12&\n\x0fnum_to_postpone\x18\x02 \x01(\rR\rnumToPostpone\"7\n\x10PostponeResponse\x12#\n\rnum_postponed\x18\x01 \x01(\rR\x0cnumPostponed*X\n\x05Score\x12\x0e\n\nSCORE_NONE\x10\x00\x12\x0f\n\x0bSCORE_AGAIN\x10\x01\x12\x0e\n\nSCORE_HARD\x10\x02\x12\x0e\n\nSCORE_GOOD\x10\x03\x12\x0e\n\nSCORE_EASY\x10\x04\x32\x81\x05\n\x10WordVaultService\x12Q\n\x0cGetCardCount\x12\x1e.wordvault.GetCardCountRequest\x1a\x1c.wordvault.CardCountResponse\"\x03\x90\x02\x01\x12J\n\x12GetCardInformation\x12\x1d.wordvault.GetCardInfoRequest\x1a\x10.wordvault.Cards\"\x03\x90\x02\x01\x12M\n\x10GetNextScheduled\x12\".wordvault.GetNextScheduledRequest\x1a\x10.wordvault.Cards\"\x03\x90\x02\x01\x12]\n\x12NextScheduledCount\x12$.wordvault.NextScheduledCountRequest\x1a!.wordvault.NextScheduledBreakdown\x12\x46\n\tScoreCard\x12\x1b.wordvault.ScoreCardRequest\x1a\x1c.wordvault.ScoreCardResponse\x12N\n\rEditLastScore\x12\x1f.wordvault.EditLastScoreRequest\x1a\x1c.wordvault.ScoreCardResponse\x12\x43\n\x08\x41\x64\x64\x43\x61rds\x12\x1a.wordvault.AddCardsRequest\x1a\x1b.wordvault.AddCardsResponse\x12\x43\n\x08Postpone\x12\x1a.wordvault.PostponeRequest\x1a\x1b.wordvault.PostponeResponseB\x93\x01\n\rcom.wordvaultB\x08\x41piProtoP\x01Z4github.com/domino14/word_db_server/api/rpc/wordvault\xa2\x02\x03WXX\xaa\x02\tWordvault\xca\x02\tWordvault\xe2\x02\x15Wordvault\\GPBMetadata\xea\x02\tWordvaultb\x06proto3')

_globals = globals()
_builder.BuildMessageAndEnumDescriptors(DESCRIPTOR, _globals)
_builder.BuildTopDescriptorsAndMessages(DESCRIPTOR, 'rpc.wordvault.api_pb2', _globals)
if not _descriptor._USE_C_DESCRIPTORS:
  _globals['DESCRIPTOR']._loaded_options = None
  _globals['DESCRIPTOR']._serialized_options = b'\n\rcom.wordvaultB\010ApiProtoP\001Z4github.com/domino14/word_db_server/api/rpc/wordvault\242\002\003WXX\252\002\tWordvault\312\002\tWordvault\342\002\025Wordvault\\GPBMetadata\352\002\tWordvault'
  _globals['_CARDCOUNTRESPONSE_NUMCARDSENTRY']._loaded_options = None
  _globals['_CARDCOUNTRESPONSE_NUMCARDSENTRY']._serialized_options = b'8\001'
  _globals['_NEXTSCHEDULEDBREAKDOWN_BREAKDOWNENTRY']._loaded_options = None
  _globals['_NEXTSCHEDULEDBREAKDOWN_BREAKDOWNENTRY']._serialized_options = b'8\001'
  _globals['_WORDVAULTSERVICE'].methods_by_name['GetCardCount']._loaded_options = None
  _globals['_WORDVAULTSERVICE'].methods_by_name['GetCardCount']._serialized_options = b'\220\002\001'
  _globals['_WORDVAULTSERVICE'].methods_by_name['GetCardInformation']._loaded_options = None
  _globals['_WORDVAULTSERVICE'].methods_by_name['GetCardInformation']._serialized_options = b'\220\002\001'
  _globals['_WORDVAULTSERVICE'].methods_by_name['GetNextScheduled']._loaded_options = None
  _globals['_WORDVAULTSERVICE'].methods_by_name['GetNextScheduled']._serialized_options = b'\220\002\001'
  _globals['_SCORE']._serialized_start=1692
  _globals['_SCORE']._serialized_end=1780
  _globals['_CARD']._serialized_start=105
  _globals['_CARD']._serialized_end=301
  _globals['_GETCARDINFOREQUEST']._serialized_start=303
  _globals['_GETCARDINFOREQUEST']._serialized_end=381
  _globals['_GETNEXTSCHEDULEDREQUEST']._serialized_start=383
  _globals['_GETNEXTSCHEDULEDREQUEST']._serialized_end=456
  _globals['_CARDS']._serialized_start=458
  _globals['_CARDS']._serialized_end=504
  _globals['_SCORECARDREQUEST']._serialized_start=506
  _globals['_SCORECARDREQUEST']._serialized_end=620
  _globals['_SCORECARDRESPONSE']._serialized_start=622
  _globals['_SCORECARDRESPONSE']._serialized_end=746
  _globals['_ADDCARDSREQUEST']._serialized_start=748
  _globals['_ADDCARDSREQUEST']._serialized_end=823
  _globals['_ADDCARDSRESPONSE']._serialized_start=825
  _globals['_ADDCARDSRESPONSE']._serialized_end=883
  _globals['_EDITLASTSCOREREQUEST']._serialized_start=886
  _globals['_EDITLASTSCOREREQUEST']._serialized_end=1049
  _globals['_GETCARDCOUNTREQUEST']._serialized_start=1051
  _globals['_GETCARDCOUNTREQUEST']._serialized_end=1072
  _globals['_CARDCOUNTRESPONSE']._serialized_start=1075
  _globals['_CARDCOUNTRESPONSE']._serialized_end=1261
  _globals['_CARDCOUNTRESPONSE_NUMCARDSENTRY']._serialized_start=1202
  _globals['_CARDCOUNTRESPONSE_NUMCARDSENTRY']._serialized_end=1261
  _globals['_NEXTSCHEDULEDCOUNTREQUEST']._serialized_start=1263
  _globals['_NEXTSCHEDULEDCOUNTREQUEST']._serialized_end=1379
  _globals['_NEXTSCHEDULEDBREAKDOWN']._serialized_start=1382
  _globals['_NEXTSCHEDULEDBREAKDOWN']._serialized_end=1548
  _globals['_NEXTSCHEDULEDBREAKDOWN_BREAKDOWNENTRY']._serialized_start=1488
  _globals['_NEXTSCHEDULEDBREAKDOWN_BREAKDOWNENTRY']._serialized_end=1548
  _globals['_POSTPONEREQUEST']._serialized_start=1550
  _globals['_POSTPONEREQUEST']._serialized_end=1633
  _globals['_POSTPONERESPONSE']._serialized_start=1635
  _globals['_POSTPONERESPONSE']._serialized_end=1690
  _globals['_WORDVAULTSERVICE']._serialized_start=1783
  _globals['_WORDVAULTSERVICE']._serialized_end=2424
# @@protoc_insertion_point(module_scope)
