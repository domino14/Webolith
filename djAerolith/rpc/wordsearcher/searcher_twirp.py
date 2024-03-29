# -*- coding: utf-8 -*-
# Generated by https://github.com/verloop/twirpy/protoc-gen-twirpy.  DO NOT EDIT!
# source: rpc/wordsearcher/searcher.proto

from google.protobuf import symbol_database as _symbol_database

from twirp.base import Endpoint
from twirp.server import TwirpServer
from twirp.client import TwirpClient

_sym_db = _symbol_database.Default()

class QuestionSearcherServer(TwirpServer):

	def __init__(self, *args, service, server_path_prefix="/twirp"):
		super().__init__(service=service)
		self._prefix = F"{server_path_prefix}/wordsearcher.QuestionSearcher"
		self._endpoints = {
			"Search": Endpoint(
				service_name="QuestionSearcher",
				name="Search",
				function=getattr(service, "Search"),
				input=_sym_db.GetSymbol("wordsearcher.SearchRequest"),
				output=_sym_db.GetSymbol("wordsearcher.SearchResponse"),
			),
			"Expand": Endpoint(
				service_name="QuestionSearcher",
				name="Expand",
				function=getattr(service, "Expand"),
				input=_sym_db.GetSymbol("wordsearcher.SearchResponse"),
				output=_sym_db.GetSymbol("wordsearcher.SearchResponse"),
			),
		}

class QuestionSearcherClient(TwirpClient):

	def Search(self, *args, ctx, request, server_path_prefix="/twirp", **kwargs):
		return self._make_request(
			url=F"{server_path_prefix}/wordsearcher.QuestionSearcher/Search",
			ctx=ctx,
			request=request,
			response_obj=_sym_db.GetSymbol("wordsearcher.SearchResponse"),
			**kwargs,
		)

	def Expand(self, *args, ctx, request, server_path_prefix="/twirp", **kwargs):
		return self._make_request(
			url=F"{server_path_prefix}/wordsearcher.QuestionSearcher/Expand",
			ctx=ctx,
			request=request,
			response_obj=_sym_db.GetSymbol("wordsearcher.SearchResponse"),
			**kwargs,
		)

class AnagrammerServer(TwirpServer):

	def __init__(self, *args, service, server_path_prefix="/twirp"):
		super().__init__(service=service)
		self._prefix = F"{server_path_prefix}/wordsearcher.Anagrammer"
		self._endpoints = {
			"Anagram": Endpoint(
				service_name="Anagrammer",
				name="Anagram",
				function=getattr(service, "Anagram"),
				input=_sym_db.GetSymbol("wordsearcher.AnagramRequest"),
				output=_sym_db.GetSymbol("wordsearcher.AnagramResponse"),
			),
			"BlankChallengeCreator": Endpoint(
				service_name="Anagrammer",
				name="BlankChallengeCreator",
				function=getattr(service, "BlankChallengeCreator"),
				input=_sym_db.GetSymbol("wordsearcher.BlankChallengeCreateRequest"),
				output=_sym_db.GetSymbol("wordsearcher.SearchResponse"),
			),
			"BuildChallengeCreator": Endpoint(
				service_name="Anagrammer",
				name="BuildChallengeCreator",
				function=getattr(service, "BuildChallengeCreator"),
				input=_sym_db.GetSymbol("wordsearcher.BuildChallengeCreateRequest"),
				output=_sym_db.GetSymbol("wordsearcher.SearchResponse"),
			),
		}

class AnagrammerClient(TwirpClient):

	def Anagram(self, *args, ctx, request, server_path_prefix="/twirp", **kwargs):
		return self._make_request(
			url=F"{server_path_prefix}/wordsearcher.Anagrammer/Anagram",
			ctx=ctx,
			request=request,
			response_obj=_sym_db.GetSymbol("wordsearcher.AnagramResponse"),
			**kwargs,
		)

	def BlankChallengeCreator(self, *args, ctx, request, server_path_prefix="/twirp", **kwargs):
		return self._make_request(
			url=F"{server_path_prefix}/wordsearcher.Anagrammer/BlankChallengeCreator",
			ctx=ctx,
			request=request,
			response_obj=_sym_db.GetSymbol("wordsearcher.SearchResponse"),
			**kwargs,
		)

	def BuildChallengeCreator(self, *args, ctx, request, server_path_prefix="/twirp", **kwargs):
		return self._make_request(
			url=F"{server_path_prefix}/wordsearcher.Anagrammer/BuildChallengeCreator",
			ctx=ctx,
			request=request,
			response_obj=_sym_db.GetSymbol("wordsearcher.SearchResponse"),
			**kwargs,
		)
