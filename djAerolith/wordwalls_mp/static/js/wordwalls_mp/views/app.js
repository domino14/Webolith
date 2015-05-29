/* global JSON */
define([
  'backbone',
  'underscore',
  'jquery',
  'views/lobby',
  'views/table',
  'views/new_table_dialog',
  'controllers/comm_controller',
  'collections/lobby_tables'
], function(Backbone, _, $, Lobby, TableView, NewTableDialog, CommController,
    Tables) {
  "use strict";
  var App, testTables, testQuestions;
  App = Backbone.View.extend({
    initialize: function(options) {
      var tables;
      tables = new Tables();
      this.lobby = new Lobby({
        tables: tables,
        el: $('.lobby')
      });
      tables.reset(testTables);
      this.listenTo(this.lobby, 'joinTable', _.bind(this.joinTable, this));
      this.listenTo(this.lobby, 'newTable', _.bind(this.newTable, this));
      this.table = new TableView({
        el: $('.table-main')
      });
      this.table.loadQuestions(testQuestions);
      this.newTableDialog = new NewTableDialog({
        el: $('#new-table-modal')
      });
      this.listenTo(this.newTableDialog, 'createTable', _.bind(this.createTable,
        this));
      this.commController = new CommController(options.firebaseToken,
        options.firebaseURL);
    },
    /**
     * A signal handler.
     */
    joinTable: function(tableId) {
      this.lobby.hide();
      this.table.show();
    },
    /**
     * The "new table" button was clicked, to bring up the dialog.
     */
    newTable: function() {
      this.newTableDialog.render();
    },
    /**
     * Create table.
     * @param {Object} triggerObj Object with info about table to create.
     */
    createTable: function(triggerObj) {
      $.post('/wordwalls_mp/api/create_table/', JSON.stringify(triggerObj),
        _.bind(this.handleTableCreate, this), 'json');
    },
    handleTableCreate: function(data) {
      this.commController
    }
  });



  ///////////////////////////////////////////////
  testTables = [{
      playerList: ['zapdos', 'moltres', 'pikachu', 'raichu', 'ninetales'],
      wordList: 'The 5s (1001 - 2000)',
      lexicon: 'America',
      timeLimit: 400
    }, {
      playerList: ['flareon', 'articuno'],
      wordList: 'JQXZ 8s',
      lexicon: 'CSW12',
      timeLimit: 300
    }, {
      playerList: ['nidorino♂', 'meowmes', 'eevee'],
      wordList: 'The 8s (2001-3000)',
      lexicon: 'America',
      timeLimit: 450
    }
  ];
  ///////////////////////////////////////////////
  testQuestions = [
  {
    "wordsRemaining": 1,
    "alphagram": "EILPRRSU",
    "idx": 0,
    "numWords": 1,
    "words": [
      {
        "definition": "adjective: characterized by the sucking sound made when slurping. See also: SLURPIER SLURPIEST",
        "word": "SLURPIER",
        "lexiconSymbol": "+",
        "frontHooks": "",
        "prob": 9545,
        "backHooks": ""
      }
    ],
    "prob": 9545
  },
  {
    "wordsRemaining": 1,
    "alphagram": "AHIMMORZ",
    "idx": 1,
    "numWords": 1,
    "words": [
      {
        "definition": "MAHZOR, a Jewish prayer book [n]",
        "word": "MAHZORIM",
        "lexiconSymbol": "",
        "frontHooks": "",
        "prob": 25188,
        "backHooks": ""
      }
    ],
    "prob": 25188
  },
  {
    "wordsRemaining": 1,
    "alphagram": "BBDFLSUU",
    "idx": 2,
    "numWords": 1,
    "words": [
      {
        "definition": "FLUBDUB, pretentious nonsense [n]",
        "word": "FLUBDUBS",
        "lexiconSymbol": "",
        "frontHooks": "",
        "prob": 27744,
        "backHooks": ""
      }
    ],
    "prob": 27744
  },
  {
    "wordsRemaining": 1,
    "alphagram": "CEIKNRSS",
    "idx": 3,
    "numWords": 1,
    "words": [
      {
        "definition": "SNICKER, to utter a partly stifled laugh [v]",
        "word": "SNICKERS",
        "lexiconSymbol": "",
        "frontHooks": "",
        "prob": 18940,
        "backHooks": ""
      }
    ],
    "prob": 18940
  },
  {
    "wordsRemaining": 1,
    "alphagram": "BEGINSTT",
    "idx": 4,
    "numWords": 1,
    "words": [
      {
        "definition": "noun: the act of gambling on the outcome of a race. See also: BETTINGS",
        "word": "BETTINGS",
        "lexiconSymbol": "+",
        "frontHooks": "",
        "prob": 8642,
        "backHooks": ""
      }
    ],
    "prob": 8642
  },
  {
    "wordsRemaining": 1,
    "alphagram": "AAGGRSTT",
    "idx": 5,
    "numWords": 1,
    "words": [
      {
        "definition": "staggard (a full-grown male red deer) [n -S]",
        "word": "STAGGART",
        "lexiconSymbol": "",
        "frontHooks": "",
        "prob": 21802,
        "backHooks": "S"
      }
    ],
    "prob": 21802
  },
  {
    "wordsRemaining": 3,
    "alphagram": "EINPRRST",
    "idx": 6,
    "numWords": 3,
    "words": [
      {
        "definition": "PRINTER, one that prints (to produce by pressed type on a surface) [n]",
        "word": "PRINTERS",
        "lexiconSymbol": "",
        "frontHooks": "S",
        "prob": 3998,
        "backHooks": ""
      },
      {
        "definition": "REPRINT, PRINT, to produce by pressed type on a surface [v]",
        "word": "REPRINTS",
        "lexiconSymbol": "",
        "frontHooks": "P",
        "prob": 3998,
        "backHooks": ""
      },
      {
        "definition": "one that sprints (to run at top speed) [n -S]",
        "word": "SPRINTER",
        "lexiconSymbol": "",
        "frontHooks": "",
        "prob": 3998,
        "backHooks": "S"
      }
    ],
    "prob": 3998
  },
  {
    "wordsRemaining": 1,
    "alphagram": "ACGHORSU",
    "idx": 7,
    "numWords": 1,
    "words": [
      {
        "definition": "the leader of a chorus or choir [n -GI or -GUSES] : CHORAGIC ~adj",
        "word": "CHORAGUS",
        "lexiconSymbol": "",
        "frontHooks": "",
        "prob": 16059,
        "backHooks": ""
      }
    ],
    "prob": 16059
  },
  {
    "wordsRemaining": 1,
    "alphagram": "EGLMMSTU",
    "idx": 8,
    "numWords": 1,
    "words": [
      {
        "definition": "GLUM, being in low spirits [adj]",
        "word": "GLUMMEST",
        "lexiconSymbol": "",
        "frontHooks": "",
        "prob": 24076,
        "backHooks": ""
      }
    ],
    "prob": 24076
  },
  {
    "wordsRemaining": 1,
    "alphagram": "ACHHILPT",
    "idx": 9,
    "numWords": 1,
    "words": [
      {
        "definition": "pertaining to a certain acid [adj]",
        "word": "PHTHALIC",
        "lexiconSymbol": "",
        "frontHooks": "",
        "prob": 25501,
        "backHooks": ""
      }
    ],
    "prob": 25501
  },
  {
    "wordsRemaining": 1,
    "alphagram": "EEELOPPR",
    "idx": 10,
    "numWords": 1,
    "words": [
      {
        "definition": "PEOPLE, to furnish with inhabitants [v -PLED, -PLING, -PLES]",
        "word": "REPEOPLE",
        "lexiconSymbol": "",
        "frontHooks": "",
        "prob": 19353,
        "backHooks": "DS"
      }
    ],
    "prob": 19353
  },
  {
    "wordsRemaining": 1,
    "alphagram": "BMOORTTY",
    "idx": 11,
    "numWords": 1,
    "words": [
      {
        "definition": "a maritime contract [n -RIES]",
        "word": "BOTTOMRY",
        "lexiconSymbol": "",
        "frontHooks": "",
        "prob": 24199,
        "backHooks": ""
      }
    ],
    "prob": 24199
  },
  {
    "wordsRemaining": 1,
    "alphagram": "ABDEILOX",
    "idx": 12,
    "numWords": 1,
    "words": [
      {
        "definition": "capable of being oxidized [adj]",
        "word": "OXIDABLE",
        "lexiconSymbol": "",
        "frontHooks": "",
        "prob": 5892,
        "backHooks": ""
      }
    ],
    "prob": 5892
  },
  {
    "wordsRemaining": 1,
    "alphagram": "ENNNOORW",
    "idx": 13,
    "numWords": 1,
    "words": [
      {
        "definition": "one who is not the owner [n -S]",
        "word": "NONOWNER",
        "lexiconSymbol": "",
        "frontHooks": "",
        "prob": 17960,
        "backHooks": "S"
      }
    ],
    "prob": 17960
  },
  {
    "wordsRemaining": 1,
    "alphagram": "DEFGJORU",
    "idx": 14,
    "numWords": 1,
    "words": [
      {
        "definition": "to deprive by judgment of a court [v -JUDGED, -JUDGING, -JUDGES]",
        "word": "FORJUDGE",
        "lexiconSymbol": "",
        "frontHooks": "",
        "prob": 17648,
        "backHooks": "DS"
      }
    ],
    "prob": 17648
  },
  {
    "wordsRemaining": 1,
    "alphagram": "AFILSTTU",
    "idx": 15,
    "numWords": 1,
    "words": [
      {
        "definition": "flutist (one who plays the flute) [n -S]",
        "word": "FLAUTIST",
        "lexiconSymbol": "",
        "frontHooks": "",
        "prob": 12055,
        "backHooks": "S"
      }
    ],
    "prob": 12055
  },
  {
    "wordsRemaining": 1,
    "alphagram": "AEGLNNTU",
    "idx": 16,
    "numWords": 1,
    "words": [
      {
        "definition": "to free from tangles [v -GLED, -GLING, -GLES]",
        "word": "UNTANGLE",
        "lexiconSymbol": "",
        "frontHooks": "",
        "prob": 4234,
        "backHooks": "DS"
      }
    ],
    "prob": 4234
  },
  {
    "wordsRemaining": 1,
    "alphagram": "AAFIQSTU",
    "idx": 17,
    "numWords": 1,
    "words": [
      {
        "definition": "noun: an exercise class in water. See also: AQUAFITS",
        "word": "AQUAFITS",
        "lexiconSymbol": "+",
        "frontHooks": "",
        "prob": 17356,
        "backHooks": ""
      }
    ],
    "prob": 17356
  },
  {
    "wordsRemaining": 1,
    "alphagram": "EFORRSUV",
    "idx": 18,
    "numWords": 1,
    "words": [
      {
        "definition": "FERVOUR, fervor (great warmth or intensity) [n]",
        "word": "FERVOURS",
        "lexiconSymbol": "",
        "frontHooks": "",
        "prob": 15680,
        "backHooks": ""
      }
    ],
    "prob": 15680
  },
  {
    "wordsRemaining": 1,
    "alphagram": "BDOOOSWW",
    "idx": 19,
    "numWords": 1,
    "words": [
      {
        "definition": "noun: a deciduous tree. See also: BOWWOODS",
        "word": "BOWWOODS",
        "lexiconSymbol": "+",
        "frontHooks": "",
        "prob": 27504,
        "backHooks": ""
      }
    ],
    "prob": 27504
  },
  {
    "wordsRemaining": 1,
    "alphagram": "CDDHILOS",
    "idx": 20,
    "numWords": 1,
    "words": [
      {
        "definition": "CLOD, a dolt (a stupid person) [adj]",
        "word": "CLODDISH",
        "lexiconSymbol": "",
        "frontHooks": "",
        "prob": 22780,
        "backHooks": ""
      }
    ],
    "prob": 22780
  },
  {
    "wordsRemaining": 1,
    "alphagram": "ACDEISSS",
    "idx": 21,
    "numWords": 1,
    "words": [
      {
        "definition": "DISCASE, to remove the case of [v]",
        "word": "DISCASES",
        "lexiconSymbol": "",
        "frontHooks": "",
        "prob": 21632,
        "backHooks": ""
      }
    ],
    "prob": 21632
  },
  {
    "wordsRemaining": 1,
    "alphagram": "AEHPRSUY",
    "idx": 22,
    "numWords": 1,
    "words": [
      {
        "definition": "an annual herb [n -SIES]",
        "word": "EUPHRASY",
        "lexiconSymbol": "",
        "frontHooks": "",
        "prob": 15445,
        "backHooks": ""
      }
    ],
    "prob": 15445
  },
  {
    "wordsRemaining": 1,
    "alphagram": "AGGMOSTY",
    "idx": 23,
    "numWords": 1,
    "words": [
      {
        "definition": "a teacher of religious mysteries [n -S]",
        "word": "MYSTAGOG",
        "lexiconSymbol": "",
        "frontHooks": "",
        "prob": 23409,
        "backHooks": "SY"
      }
    ],
    "prob": 23409
  },
  {
    "wordsRemaining": 1,
    "alphagram": "EGIILRST",
    "idx": 24,
    "numWords": 1,
    "words": [
      {
        "definition": "GIRLIE, girlish (of, pertaining to, or having the characteristics of a girl) [adj]",
        "word": "GIRLIEST",
        "lexiconSymbol": "",
        "frontHooks": "",
        "prob": 2139,
        "backHooks": ""
      }
    ],
    "prob": 2139
  },
  {
    "wordsRemaining": 1,
    "alphagram": "AEEGLRTU",
    "idx": 25,
    "numWords": 1,
    "words": [
      {
        "definition": "to control according to rule [v -LATED, -LATING, -LATES]",
        "word": "REGULATE",
        "lexiconSymbol": "",
        "frontHooks": "",
        "prob": 1182,
        "backHooks": "DS"
      }
    ],
    "prob": 1182
  },
  {
    "wordsRemaining": 1,
    "alphagram": "CIMNNOSU",
    "idx": 26,
    "numWords": 1,
    "words": [
      {
        "definition": "inferior music [n -S]",
        "word": "NONMUSIC",
        "lexiconSymbol": "",
        "frontHooks": "",
        "prob": 17857,
        "backHooks": "S"
      }
    ],
    "prob": 17857
  },
  {
    "wordsRemaining": 1,
    "alphagram": "ACGIMOUU",
    "idx": 27,
    "numWords": 1,
    "words": [
      {
        "definition": "guaiacum (a medicinal resin) [n -S]",
        "word": "GUAIOCUM",
        "lexiconSymbol": "",
        "frontHooks": "",
        "prob": 19826,
        "backHooks": "S"
      }
    ],
    "prob": 19826
  },
  {
    "wordsRemaining": 1,
    "alphagram": "CEKOPRST",
    "idx": 28,
    "numWords": 1,
    "words": [
      {
        "definition": "a toothlike projection that engages with the links of a chain [n -S]",
        "word": "SPROCKET",
        "lexiconSymbol": "",
        "frontHooks": "",
        "prob": 17321,
        "backHooks": "S"
      }
    ],
    "prob": 17321
  },
  {
    "wordsRemaining": 1,
    "alphagram": "EEOPSSSU",
    "idx": 29,
    "numWords": 1,
    "words": [
      {
        "definition": "ESPOUSE, to marry (to enter into marriage) [v]",
        "word": "ESPOUSES",
        "lexiconSymbol": "",
        "frontHooks": "B",
        "prob": 24387,
        "backHooks": ""
      }
    ],
    "prob": 24387
  },
  {
    "wordsRemaining": 2,
    "alphagram": "DEGIIRST",
    "idx": 30,
    "numWords": 2,
    "words": [
      {
        "definition": "RIDGY, having ridges [adj]",
        "word": "RIDGIEST",
        "lexiconSymbol": "",
        "frontHooks": "",
        "prob": 2146,
        "backHooks": ""
      },
      {
        "definition": "adjective: not flexible; strict, harsh. See also: RIGIDER RIGIDEST",
        "word": "RIGIDEST",
        "lexiconSymbol": "+",
        "frontHooks": "",
        "prob": 2146,
        "backHooks": ""
      }
    ],
    "prob": 2146
  },
  {
    "wordsRemaining": 2,
    "alphagram": "AEGGRSST",
    "idx": 31,
    "numWords": 2,
    "words": [
      {
        "definition": "GAGSTER, a gagman (one who writes jokes) [n]",
        "word": "GAGSTERS",
        "lexiconSymbol": "",
        "frontHooks": "",
        "prob": 17489,
        "backHooks": ""
      },
      {
        "definition": "STAGGER, to walk or stand unsteadily [v]",
        "word": "STAGGERS",
        "lexiconSymbol": "",
        "frontHooks": "",
        "prob": 17489,
        "backHooks": ""
      }
    ],
    "prob": 17489
  },
  {
    "wordsRemaining": 1,
    "alphagram": "ADDEGLST",
    "idx": 32,
    "numWords": 1,
    "words": [
      {
        "definition": "GLAD, feeling pleasure [adj]",
        "word": "GLADDEST",
        "lexiconSymbol": "",
        "frontHooks": "",
        "prob": 10403,
        "backHooks": ""
      }
    ],
    "prob": 10403
  },
  {
    "wordsRemaining": 1,
    "alphagram": "CDHIOPRW",
    "idx": 33,
    "numWords": 1,
    "words": [
      {
        "definition": "a strong, twisted cord [n -S]",
        "word": "WHIPCORD",
        "lexiconSymbol": "",
        "frontHooks": "",
        "prob": 22133,
        "backHooks": "S"
      }
    ],
    "prob": 22133
  },
  {
    "wordsRemaining": 1,
    "alphagram": "AEHIILMO",
    "idx": 34,
    "numWords": 1,
    "words": [
      {
        "definition": "hemiola (a rhythmic alteration in music) [n -S]",
        "word": "HEMIOLIA",
        "lexiconSymbol": "",
        "frontHooks": "",
        "prob": 3269,
        "backHooks": "S"
      }
    ],
    "prob": 3269
  },
  {
    "wordsRemaining": 1,
    "alphagram": "CDENOORT",
    "idx": 35,
    "numWords": 1,
    "words": [
      {
        "definition": "an extinct carnivore [n -S]",
        "word": "CREODONT",
        "lexiconSymbol": "",
        "frontHooks": "",
        "prob": 3105,
        "backHooks": "S"
      }
    ],
    "prob": 3105
  },
  {
    "wordsRemaining": 2,
    "alphagram": "AEENRRTT",
    "idx": 36,
    "numWords": 2,
    "words": [
      {
        "definition": "noun: one that natters. See also: NATTERERS",
        "word": "NATTERER",
        "lexiconSymbol": "+",
        "frontHooks": "",
        "prob": 2507,
        "backHooks": "S"
      },
      {
        "definition": "one that rattens (to harass (to bother persistently)) [n -S]",
        "word": "RATTENER",
        "lexiconSymbol": "",
        "frontHooks": "",
        "prob": 2507,
        "backHooks": "S"
      }
    ],
    "prob": 2507
  },
  {
    "wordsRemaining": 1,
    "alphagram": "AAEFIRRS",
    "idx": 37,
    "numWords": 1,
    "words": [
      {
        "definition": "AIRFARE, payment for travel by airplane [n]",
        "word": "AIRFARES",
        "lexiconSymbol": "",
        "frontHooks": "",
        "prob": 4253,
        "backHooks": ""
      }
    ],
    "prob": 4253
  },
  {
    "wordsRemaining": 1,
    "alphagram": "CMMOPSSY",
    "idx": 38,
    "numWords": 1,
    "words": [
      {
        "definition": "COMSYMP, a person sympathetic to Communist causes -- an offensive term [n]",
        "word": "COMSYMPS",
        "lexiconSymbol": "",
        "frontHooks": "",
        "prob": 27840,
        "backHooks": ""
      }
    ],
    "prob": 27840
  },
  {
    "wordsRemaining": 1,
    "alphagram": "ADEHQSSU",
    "idx": 39,
    "numWords": 1,
    "words": [
      {
        "definition": "SQUASH, to press into a pulp or flat mass [v]",
        "word": "SQUASHED",
        "lexiconSymbol": "",
        "frontHooks": "",
        "prob": 23144,
        "backHooks": ""
      }
    ],
    "prob": 23144
  },
  {
    "wordsRemaining": 1,
    "alphagram": "ADFHINSS",
    "idx": 40,
    "numWords": 1,
    "words": [
      {
        "definition": "a marine fish [n -ES]",
        "word": "SANDFISH",
        "lexiconSymbol": "",
        "frontHooks": "",
        "prob": 19981,
        "backHooks": ""
      }
    ],
    "prob": 19981
  },
  {
    "wordsRemaining": 1,
    "alphagram": "AEILNPTT",
    "idx": 41,
    "numWords": 1,
    "words": [
      {
        "definition": "thin sheet iron coated with tin [n -S]",
        "word": "TINPLATE",
        "lexiconSymbol": "",
        "frontHooks": "",
        "prob": 2065,
        "backHooks": "DS"
      }
    ],
    "prob": 2065
  },
  {
    "wordsRemaining": 1,
    "alphagram": "ACIMSSST",
    "idx": 42,
    "numWords": 1,
    "words": [
      {
        "definition": "MISCAST, to cast in an unsuitable role [v]",
        "word": "MISCASTS",
        "lexiconSymbol": "",
        "frontHooks": "",
        "prob": 26091,
        "backHooks": ""
      }
    ],
    "prob": 26091
  },
  {
    "wordsRemaining": 1,
    "alphagram": "ABCEHNRR",
    "idx": 43,
    "numWords": 1,
    "words": [
      {
        "definition": "to form secondary branches [v -ED, -ING, -ES]",
        "word": "REBRANCH",
        "lexiconSymbol": "",
        "frontHooks": "",
        "prob": 16497,
        "backHooks": ""
      }
    ],
    "prob": 16497
  },
  {
    "wordsRemaining": 1,
    "alphagram": "AABCISSS",
    "idx": 44,
    "numWords": 1,
    "words": [
      {
        "definition": "a particular geometric coordinate [n -SAS or -SAE]",
        "word": "ABSCISSA",
        "lexiconSymbol": "",
        "frontHooks": "",
        "prob": 26844,
        "backHooks": "ES"
      }
    ],
    "prob": 26844
  },
  {
    "wordsRemaining": 1,
    "alphagram": "EIKLLMOO",
    "idx": 45,
    "numWords": 1,
    "words": [
      {
        "definition": "one thousand moles [n -S]",
        "word": "KILOMOLE",
        "lexiconSymbol": "",
        "frontHooks": "",
        "prob": 20708,
        "backHooks": "S"
      }
    ],
    "prob": 20708
  },
  {
    "wordsRemaining": 2,
    "alphagram": "ABEIKLLM",
    "idx": 46,
    "numWords": 2,
    "words": [
      {
        "definition": "BALM, a fragrant resin [adj]",
        "word": "BALMLIKE",
        "lexiconSymbol": "",
        "frontHooks": "",
        "prob": 22432,
        "backHooks": ""
      },
      {
        "definition": "resembling a lamb [adj]",
        "word": "LAMBLIKE",
        "lexiconSymbol": "",
        "frontHooks": "",
        "prob": 22432,
        "backHooks": ""
      }
    ],
    "prob": 22432
  },
  {
    "wordsRemaining": 1,
    "alphagram": "AEEFNRTT",
    "idx": 47,
    "numWords": 1,
    "words": [
      {
        "definition": "one that fattens (to make fat (having an abundance of flesh)) [n -S]",
        "word": "FATTENER",
        "lexiconSymbol": "",
        "frontHooks": "",
        "prob": 2828,
        "backHooks": "S"
      }
    ],
    "prob": 2828
  },
  {
    "wordsRemaining": 1,
    "alphagram": "AAFILSTT",
    "idx": 48,
    "numWords": 1,
    "words": [
      {
        "definition": "a believer in fatalism (the doctrine that all events are predetermined) [n -S]",
        "word": "FATALIST",
        "lexiconSymbol": "",
        "frontHooks": "",
        "prob": 12692,
        "backHooks": "S"
      }
    ],
    "prob": 12692
  },
  {
    "wordsRemaining": 1,
    "alphagram": "AELSTTUU",
    "idx": 49,
    "numWords": 1,
    "words": [
      {
        "definition": "scorched [adj]",
        "word": "USTULATE",
        "lexiconSymbol": "",
        "frontHooks": "P",
        "prob": 12542,
        "backHooks": ""
      }
    ],
    "prob": 12542
  }];
  return App;
});