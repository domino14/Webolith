# -*- coding: utf-8 -*-
# Generated by the protocol buffer compiler.  DO NOT EDIT!
# source: rpc/anagrammer/anagrammer.proto

import sys
_b=sys.version_info[0]<3 and (lambda x:x) or (lambda x:x.encode('latin1'))
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from google.protobuf import reflection as _reflection
from google.protobuf import symbol_database as _symbol_database
# @@protoc_insertion_point(imports)

_sym_db = _symbol_database.Default()


from rpc.wordsearcher import searcher_pb2 as rpc_dot_wordsearcher_dot_searcher__pb2


DESCRIPTOR = _descriptor.FileDescriptor(
  name='rpc/anagrammer/anagrammer.proto',
  package='anagrammer',
  syntax='proto3',
  serialized_options=_b('Z1github.com/domino14/word_db_server/rpc/anagrammer'),
  serialized_pb=_b('\n\x1frpc/anagrammer/anagrammer.proto\x12\nanagrammer\x1a\x1frpc/wordsearcher/searcher.proto\"\x8f\x01\n\x0e\x41nagramRequest\x12\x0f\n\x07lexicon\x18\x01 \x01(\t\x12\x0f\n\x07letters\x18\x02 \x01(\t\x12-\n\x04mode\x18\x03 \x01(\x0e\x32\x1f.anagrammer.AnagramRequest.Mode\x12\x0e\n\x06\x65xpand\x18\x04 \x01(\x08\"\x1c\n\x04Mode\x12\t\n\x05\x45XACT\x10\x00\x12\t\n\x05\x42UILD\x10\x01\"G\n\x0f\x41nagramResponse\x12!\n\x05words\x18\x01 \x03(\x0b\x32\x12.wordsearcher.Word\x12\x11\n\tnum_words\x18\x02 \x01(\x05\"\x8c\x01\n\x1b\x42lankChallengeCreateRequest\x12\x0f\n\x07lexicon\x18\x01 \x01(\t\x12\x15\n\rnum_questions\x18\x02 \x01(\x05\x12\x15\n\rmax_solutions\x18\x03 \x01(\x05\x12\x19\n\x11num_with_2_blanks\x18\x04 \x01(\x05\x12\x13\n\x0bword_length\x18\x05 \x01(\x05\"\xa5\x01\n\x1b\x42uildChallengeCreateRequest\x12\x0f\n\x07lexicon\x18\x01 \x01(\t\x12\x15\n\rmin_solutions\x18\x02 \x01(\x05\x12\x15\n\rmax_solutions\x18\x03 \x01(\x05\x12\x12\n\nmin_length\x18\x04 \x01(\x05\x12\x12\n\nmax_length\x18\x05 \x01(\x05\x12\x1f\n\x17require_length_solution\x18\x06 \x01(\x08\x32\x90\x02\n\nAnagrammer\x12\x42\n\x07\x41nagram\x12\x1a.anagrammer.AnagramRequest\x1a\x1b.anagrammer.AnagramResponse\x12^\n\x15\x42lankChallengeCreator\x12\'.anagrammer.BlankChallengeCreateRequest\x1a\x1c.wordsearcher.SearchResponse\x12^\n\x15\x42uildChallengeCreator\x12\'.anagrammer.BuildChallengeCreateRequest\x1a\x1c.wordsearcher.SearchResponseB3Z1github.com/domino14/word_db_server/rpc/anagrammerb\x06proto3')
  ,
  dependencies=[rpc_dot_wordsearcher_dot_searcher__pb2.DESCRIPTOR,])



_ANAGRAMREQUEST_MODE = _descriptor.EnumDescriptor(
  name='Mode',
  full_name='anagrammer.AnagramRequest.Mode',
  filename=None,
  file=DESCRIPTOR,
  values=[
    _descriptor.EnumValueDescriptor(
      name='EXACT', index=0, number=0,
      serialized_options=None,
      type=None),
    _descriptor.EnumValueDescriptor(
      name='BUILD', index=1, number=1,
      serialized_options=None,
      type=None),
  ],
  containing_type=None,
  serialized_options=None,
  serialized_start=196,
  serialized_end=224,
)
_sym_db.RegisterEnumDescriptor(_ANAGRAMREQUEST_MODE)


_ANAGRAMREQUEST = _descriptor.Descriptor(
  name='AnagramRequest',
  full_name='anagrammer.AnagramRequest',
  filename=None,
  file=DESCRIPTOR,
  containing_type=None,
  fields=[
    _descriptor.FieldDescriptor(
      name='lexicon', full_name='anagrammer.AnagramRequest.lexicon', index=0,
      number=1, type=9, cpp_type=9, label=1,
      has_default_value=False, default_value=_b("").decode('utf-8'),
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      serialized_options=None, file=DESCRIPTOR),
    _descriptor.FieldDescriptor(
      name='letters', full_name='anagrammer.AnagramRequest.letters', index=1,
      number=2, type=9, cpp_type=9, label=1,
      has_default_value=False, default_value=_b("").decode('utf-8'),
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      serialized_options=None, file=DESCRIPTOR),
    _descriptor.FieldDescriptor(
      name='mode', full_name='anagrammer.AnagramRequest.mode', index=2,
      number=3, type=14, cpp_type=8, label=1,
      has_default_value=False, default_value=0,
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      serialized_options=None, file=DESCRIPTOR),
    _descriptor.FieldDescriptor(
      name='expand', full_name='anagrammer.AnagramRequest.expand', index=3,
      number=4, type=8, cpp_type=7, label=1,
      has_default_value=False, default_value=False,
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      serialized_options=None, file=DESCRIPTOR),
  ],
  extensions=[
  ],
  nested_types=[],
  enum_types=[
    _ANAGRAMREQUEST_MODE,
  ],
  serialized_options=None,
  is_extendable=False,
  syntax='proto3',
  extension_ranges=[],
  oneofs=[
  ],
  serialized_start=81,
  serialized_end=224,
)


_ANAGRAMRESPONSE = _descriptor.Descriptor(
  name='AnagramResponse',
  full_name='anagrammer.AnagramResponse',
  filename=None,
  file=DESCRIPTOR,
  containing_type=None,
  fields=[
    _descriptor.FieldDescriptor(
      name='words', full_name='anagrammer.AnagramResponse.words', index=0,
      number=1, type=11, cpp_type=10, label=3,
      has_default_value=False, default_value=[],
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      serialized_options=None, file=DESCRIPTOR),
    _descriptor.FieldDescriptor(
      name='num_words', full_name='anagrammer.AnagramResponse.num_words', index=1,
      number=2, type=5, cpp_type=1, label=1,
      has_default_value=False, default_value=0,
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      serialized_options=None, file=DESCRIPTOR),
  ],
  extensions=[
  ],
  nested_types=[],
  enum_types=[
  ],
  serialized_options=None,
  is_extendable=False,
  syntax='proto3',
  extension_ranges=[],
  oneofs=[
  ],
  serialized_start=226,
  serialized_end=297,
)


_BLANKCHALLENGECREATEREQUEST = _descriptor.Descriptor(
  name='BlankChallengeCreateRequest',
  full_name='anagrammer.BlankChallengeCreateRequest',
  filename=None,
  file=DESCRIPTOR,
  containing_type=None,
  fields=[
    _descriptor.FieldDescriptor(
      name='lexicon', full_name='anagrammer.BlankChallengeCreateRequest.lexicon', index=0,
      number=1, type=9, cpp_type=9, label=1,
      has_default_value=False, default_value=_b("").decode('utf-8'),
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      serialized_options=None, file=DESCRIPTOR),
    _descriptor.FieldDescriptor(
      name='num_questions', full_name='anagrammer.BlankChallengeCreateRequest.num_questions', index=1,
      number=2, type=5, cpp_type=1, label=1,
      has_default_value=False, default_value=0,
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      serialized_options=None, file=DESCRIPTOR),
    _descriptor.FieldDescriptor(
      name='max_solutions', full_name='anagrammer.BlankChallengeCreateRequest.max_solutions', index=2,
      number=3, type=5, cpp_type=1, label=1,
      has_default_value=False, default_value=0,
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      serialized_options=None, file=DESCRIPTOR),
    _descriptor.FieldDescriptor(
      name='num_with_2_blanks', full_name='anagrammer.BlankChallengeCreateRequest.num_with_2_blanks', index=3,
      number=4, type=5, cpp_type=1, label=1,
      has_default_value=False, default_value=0,
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      serialized_options=None, file=DESCRIPTOR),
    _descriptor.FieldDescriptor(
      name='word_length', full_name='anagrammer.BlankChallengeCreateRequest.word_length', index=4,
      number=5, type=5, cpp_type=1, label=1,
      has_default_value=False, default_value=0,
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      serialized_options=None, file=DESCRIPTOR),
  ],
  extensions=[
  ],
  nested_types=[],
  enum_types=[
  ],
  serialized_options=None,
  is_extendable=False,
  syntax='proto3',
  extension_ranges=[],
  oneofs=[
  ],
  serialized_start=300,
  serialized_end=440,
)


_BUILDCHALLENGECREATEREQUEST = _descriptor.Descriptor(
  name='BuildChallengeCreateRequest',
  full_name='anagrammer.BuildChallengeCreateRequest',
  filename=None,
  file=DESCRIPTOR,
  containing_type=None,
  fields=[
    _descriptor.FieldDescriptor(
      name='lexicon', full_name='anagrammer.BuildChallengeCreateRequest.lexicon', index=0,
      number=1, type=9, cpp_type=9, label=1,
      has_default_value=False, default_value=_b("").decode('utf-8'),
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      serialized_options=None, file=DESCRIPTOR),
    _descriptor.FieldDescriptor(
      name='min_solutions', full_name='anagrammer.BuildChallengeCreateRequest.min_solutions', index=1,
      number=2, type=5, cpp_type=1, label=1,
      has_default_value=False, default_value=0,
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      serialized_options=None, file=DESCRIPTOR),
    _descriptor.FieldDescriptor(
      name='max_solutions', full_name='anagrammer.BuildChallengeCreateRequest.max_solutions', index=2,
      number=3, type=5, cpp_type=1, label=1,
      has_default_value=False, default_value=0,
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      serialized_options=None, file=DESCRIPTOR),
    _descriptor.FieldDescriptor(
      name='min_length', full_name='anagrammer.BuildChallengeCreateRequest.min_length', index=3,
      number=4, type=5, cpp_type=1, label=1,
      has_default_value=False, default_value=0,
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      serialized_options=None, file=DESCRIPTOR),
    _descriptor.FieldDescriptor(
      name='max_length', full_name='anagrammer.BuildChallengeCreateRequest.max_length', index=4,
      number=5, type=5, cpp_type=1, label=1,
      has_default_value=False, default_value=0,
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      serialized_options=None, file=DESCRIPTOR),
    _descriptor.FieldDescriptor(
      name='require_length_solution', full_name='anagrammer.BuildChallengeCreateRequest.require_length_solution', index=5,
      number=6, type=8, cpp_type=7, label=1,
      has_default_value=False, default_value=False,
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      serialized_options=None, file=DESCRIPTOR),
  ],
  extensions=[
  ],
  nested_types=[],
  enum_types=[
  ],
  serialized_options=None,
  is_extendable=False,
  syntax='proto3',
  extension_ranges=[],
  oneofs=[
  ],
  serialized_start=443,
  serialized_end=608,
)

_ANAGRAMREQUEST.fields_by_name['mode'].enum_type = _ANAGRAMREQUEST_MODE
_ANAGRAMREQUEST_MODE.containing_type = _ANAGRAMREQUEST
_ANAGRAMRESPONSE.fields_by_name['words'].message_type = rpc_dot_wordsearcher_dot_searcher__pb2._WORD
DESCRIPTOR.message_types_by_name['AnagramRequest'] = _ANAGRAMREQUEST
DESCRIPTOR.message_types_by_name['AnagramResponse'] = _ANAGRAMRESPONSE
DESCRIPTOR.message_types_by_name['BlankChallengeCreateRequest'] = _BLANKCHALLENGECREATEREQUEST
DESCRIPTOR.message_types_by_name['BuildChallengeCreateRequest'] = _BUILDCHALLENGECREATEREQUEST
_sym_db.RegisterFileDescriptor(DESCRIPTOR)

AnagramRequest = _reflection.GeneratedProtocolMessageType('AnagramRequest', (_message.Message,), dict(
  DESCRIPTOR = _ANAGRAMREQUEST,
  __module__ = 'rpc.anagrammer.anagrammer_pb2'
  # @@protoc_insertion_point(class_scope:anagrammer.AnagramRequest)
  ))
_sym_db.RegisterMessage(AnagramRequest)

AnagramResponse = _reflection.GeneratedProtocolMessageType('AnagramResponse', (_message.Message,), dict(
  DESCRIPTOR = _ANAGRAMRESPONSE,
  __module__ = 'rpc.anagrammer.anagrammer_pb2'
  # @@protoc_insertion_point(class_scope:anagrammer.AnagramResponse)
  ))
_sym_db.RegisterMessage(AnagramResponse)

BlankChallengeCreateRequest = _reflection.GeneratedProtocolMessageType('BlankChallengeCreateRequest', (_message.Message,), dict(
  DESCRIPTOR = _BLANKCHALLENGECREATEREQUEST,
  __module__ = 'rpc.anagrammer.anagrammer_pb2'
  # @@protoc_insertion_point(class_scope:anagrammer.BlankChallengeCreateRequest)
  ))
_sym_db.RegisterMessage(BlankChallengeCreateRequest)

BuildChallengeCreateRequest = _reflection.GeneratedProtocolMessageType('BuildChallengeCreateRequest', (_message.Message,), dict(
  DESCRIPTOR = _BUILDCHALLENGECREATEREQUEST,
  __module__ = 'rpc.anagrammer.anagrammer_pb2'
  # @@protoc_insertion_point(class_scope:anagrammer.BuildChallengeCreateRequest)
  ))
_sym_db.RegisterMessage(BuildChallengeCreateRequest)


DESCRIPTOR._options = None

_ANAGRAMMER = _descriptor.ServiceDescriptor(
  name='Anagrammer',
  full_name='anagrammer.Anagrammer',
  file=DESCRIPTOR,
  index=0,
  serialized_options=None,
  serialized_start=611,
  serialized_end=883,
  methods=[
  _descriptor.MethodDescriptor(
    name='Anagram',
    full_name='anagrammer.Anagrammer.Anagram',
    index=0,
    containing_service=None,
    input_type=_ANAGRAMREQUEST,
    output_type=_ANAGRAMRESPONSE,
    serialized_options=None,
  ),
  _descriptor.MethodDescriptor(
    name='BlankChallengeCreator',
    full_name='anagrammer.Anagrammer.BlankChallengeCreator',
    index=1,
    containing_service=None,
    input_type=_BLANKCHALLENGECREATEREQUEST,
    output_type=rpc_dot_wordsearcher_dot_searcher__pb2._SEARCHRESPONSE,
    serialized_options=None,
  ),
  _descriptor.MethodDescriptor(
    name='BuildChallengeCreator',
    full_name='anagrammer.Anagrammer.BuildChallengeCreator',
    index=2,
    containing_service=None,
    input_type=_BUILDCHALLENGECREATEREQUEST,
    output_type=rpc_dot_wordsearcher_dot_searcher__pb2._SEARCHRESPONSE,
    serialized_options=None,
  ),
])
_sym_db.RegisterServiceDescriptor(_ANAGRAMMER)

DESCRIPTOR.services_by_name['Anagrammer'] = _ANAGRAMMER

# @@protoc_insertion_point(module_scope)