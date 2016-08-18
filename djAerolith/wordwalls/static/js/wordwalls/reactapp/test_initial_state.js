define([
], function() {
  /**
   * Initial state, used for building an initial static version of the app.
   */
  var initialWordwallsData = {
    "serverMsg": "These are questions 1 through 50 of 50.",
    "gameType": "challenge",
    "questions": [
      {
        "a": "ABBGMSU",
        "p": 20423,
        "ws": [
          {
            "ibh": true,
            "d": "BUMBAG, a pack that straps to the waist [n]",
            "bh": "",
            "s": "+",
            "w": "BUMBAGS",
            "fh": "",
            "ifh": false
          }
        ],
        "idx": 0
      },
      {
        "a": "AEISSSW",
        "p": 16443,
        "ws": [
          {
            "ibh": false,
            "d": "a wiseacre (a pretentiously wise person) [n WISEASSES]",
            "bh": "",
            "s": "",
            "w": "WISEASS",
            "fh": "",
            "ifh": false
          }
        ],
        "idx": 1
      },
      {
        "a": "ABCGKLO",
        "p": 18646,
        "ws": [
          {
            "ibh": false,
            "d": "to accumulate [v BACKLOGGED, BACKLOGGING, BACKLOGS]",
            "bh": "S",
            "s": "",
            "w": "BACKLOG",
            "fh": "",
            "ifh": false
          }
        ],
        "idx": 2
      },
      {
        "a": "EGGIIRW",
        "p": 13728,
        "ws": [
          {
            "ibh": false,
            "d": "WIGGY, crazy (insane (mentally unsound)) [adj]",
            "bh": "",
            "s": "",
            "w": "WIGGIER",
            "fh": "T",
            "ifh": false
          }
        ],
        "idx": 3
      },
      {
        "a": "AGINORT",
        "p": 148,
        "ws": [
          {
            "ibh": false,
            "d": "ORATE, to speak formally [v]",
            "bh": "",
            "s": "",
            "w": "ORATING",
            "fh": "B",
            "ifh": true
          }
        ],
        "idx": 4
      },
      {
        "a": "EGGIORS",
        "p": 5082,
        "ws": [
          {
            "ibh": false,
            "d": "SOGGY, heavy with moisture [adj]",
            "bh": "",
            "s": "",
            "w": "SOGGIER",
            "fh": "",
            "ifh": false
          }
        ],
        "idx": 5
      },
      {
        "a": "AFLRTUY",
        "p": 12059,
        "ws": [
          {
            "ibh": false,
            "d": "as much as a tray will hold [n TRAYFULS]",
            "bh": "S",
            "s": "",
            "w": "TRAYFUL",
            "fh": "",
            "ifh": false
          }
        ],
        "idx": 6
      },
      {
        "a": "DIMOSSW",
        "p": 17274,
        "ws": [
          {
            "ibh": true,
            "d": "WISDOM, the power of true and right discernment [n]",
            "bh": "",
            "s": "",
            "w": "WISDOMS",
            "fh": "",
            "ifh": false
          }
        ],
        "idx": 7
      },
      {
        "a": "EIOORTZ",
        "p": 1963,
        "ws": [
          {
            "ibh": false,
            "d": "ZOOTY, flashy in manner or style [adj]",
            "bh": "",
            "s": "",
            "w": "ZOOTIER",
            "fh": "",
            "ifh": false
          }
        ],
        "idx": 8
      },
      {
        "a": "CENPRTY",
        "p": 11711,
        "ws": [
          {
            "ibh": false,
            "d": "to encipher (to write in characters of hidden meaning) [v ENCRYPTED, ENCRYPTING, ENCRYPTS]",
            "bh": "S",
            "s": "",
            "w": "ENCRYPT",
            "fh": "",
            "ifh": false
          }
        ],
        "idx": 9
      },
      {
        "a": "EILOORW",
        "p": 1782,
        "ws": [
          {
            "ibh": true,
            "d": "WOOLY, woolly (consisting of or resembling wool) [adj]",
            "bh": "",
            "s": "",
            "w": "WOOLIER",
            "fh": "",
            "ifh": false
          }
        ],
        "idx": 10
      },
      {
        "a": "DHIMOPR",
        "p": 14018,
        "ws": [
          {
            "ibh": false,
            "d": "either of two distinct forms [n DIMORPHS]",
            "bh": "S",
            "s": "",
            "w": "DIMORPH",
            "fh": "",
            "ifh": false
          }
        ],
        "idx": 11
      },
      {
        "a": "ILRSSTY",
        "p": 14182,
        "ws": [
          {
            "ibh": true,
            "d": "LYRIST, one who plays the lyre [n]",
            "bh": "",
            "s": "",
            "w": "LYRISTS",
            "fh": "",
            "ifh": false
          }
        ],
        "idx": 12
      },
      {
        "a": "AEEKSSS",
        "p": 19444,
        "ws": [
          {
            "ibh": false,
            "d": "ASKESIS, ascesis (the conduct of an ascetic) [n]",
            "bh": "",
            "s": "",
            "w": "ASKESES",
            "fh": "",
            "ifh": false
          }
        ],
        "idx": 13
      },
      {
        "a": "ABFILRU",
        "p": 9312,
        "ws": [
          {
            "ibh": true,
            "d": "FIBULA, a bone of the leg [adj]",
            "bh": "",
            "s": "",
            "w": "FIBULAR",
            "fh": "",
            "ifh": false
          }
        ],
        "idx": 14
      },
      {
        "a": "ADDEGLR",
        "p": 7535,
        "ws": [
          {
            "ibh": false,
            "d": "GLAD, feeling pleasure [adj]",
            "bh": "",
            "s": "",
            "w": "GLADDER",
            "fh": "",
            "ifh": true
          }
        ],
        "idx": 15
      },
      {
        "a": "EGGIRRT",
        "p": 10413,
        "ws": [
          {
            "ibh": false,
            "d": "TRIG, neat (being in a state of cleanliness and order) [adj]\nto actuate (to set into action or motion) [v TRIGGERED, TRIGGERING, TRIGGERS]",
            "bh": "S",
            "s": "",
            "w": "TRIGGER",
            "fh": "",
            "ifh": true
          }
        ],
        "idx": 16
      },
      {
        "a": "ADIRSTY",
        "p": 3299,
        "ws": [
          {
            "ibh": false,
            "d": "a brownish butterfly [n SATYRIDS]",
            "bh": "S",
            "s": "",
            "w": "SATYRID",
            "fh": "",
            "ifh": false
          }
        ],
        "idx": 17
      },
      {
        "a": "AEILTVY",
        "p": 2862,
        "ws": [
          {
            "ibh": false,
            "d": "an administrative division of Turkey [n VILAYETS]",
            "bh": "S",
            "s": "",
            "w": "VILAYET",
            "fh": "",
            "ifh": false
          }
        ],
        "idx": 18
      },
      {
        "a": "EIPSSUZ",
        "p": 17608,
        "ws": [
          {
            "ibh": true,
            "d": "UPSIZE, to increase in size [v]",
            "bh": "",
            "s": "",
            "w": "UPSIZES",
            "fh": "",
            "ifh": false
          }
        ],
        "idx": 19
      },
      {
        "a": "AAHNPSS",
        "p": 18388,
        "ws": [
          {
            "ibh": true,
            "d": "ASHPAN, a tray under a grate to catch the ashes [n]",
            "bh": "",
            "s": "+",
            "w": "ASHPANS",
            "fh": "",
            "ifh": false
          }
        ],
        "idx": 20
      },
      {
        "a": "AAEGRST",
        "p": 1325,
        "ws": [
          {
            "ibh": false,
            "d": "gastraea (a type of metazoan (any of a major division of multicellular animals)) [n GASTREAS]",
            "bh": "S",
            "s": "",
            "w": "GASTREA",
            "fh": "",
            "ifh": false
          },
          {
            "ibh": false,
            "d": "to subject to a gas that irritates the eyes [v TEARGASSED, TEARGASSING, TEARGASES or TEARGASSES]",
            "bh": "",
            "s": "",
            "w": "TEARGAS",
            "fh": "",
            "ifh": false
          }
        ],
        "idx": 21
      },
      {
        "a": "AEFHLLS",
        "p": 15552,
        "ws": [
          {
            "ibh": true,
            "d": "FELLAH, a peasant or laborer in Arab countries [n]",
            "bh": "",
            "s": "",
            "w": "FELLAHS",
            "fh": "",
            "ifh": false
          }
        ],
        "idx": 22
      },
      {
        "a": "CDEHHIT",
        "p": 16812,
        "ws": [
          {
            "ibh": false,
            "d": "HITCH, to fasten with a knot or hook [v]",
            "bh": "",
            "s": "",
            "w": "HITCHED",
            "fh": "",
            "ifh": true
          }
        ],
        "idx": 23
      },
      {
        "a": "EEELPRS",
        "p": 9023,
        "ws": [
          {
            "ibh": true,
            "d": "PEELER, one that peels (to strip off an outer covering of) [n]",
            "bh": "",
            "s": "",
            "w": "PEELERS",
            "fh": "",
            "ifh": false
          },
          {
            "ibh": false,
            "d": "one that sleeps (to be in a natural, periodic state of rest) [n SLEEPERS]",
            "bh": "S",
            "s": "",
            "w": "SLEEPER",
            "fh": "",
            "ifh": false
          }
        ],
        "idx": 24
      },
      {
        "a": "CELORSS",
        "p": 10640,
        "ws": [
          {
            "ibh": true,
            "d": "CLOSER, one that closes (to block against entry or passage) [n]",
            "bh": "",
            "s": "",
            "w": "CLOSERS",
            "fh": "",
            "ifh": true
          },
          {
            "ibh": true,
            "d": "CRESOL, a chemical disinfectant [n]",
            "bh": "",
            "s": "",
            "w": "CRESOLS",
            "fh": "",
            "ifh": false
          }
        ],
        "idx": 25
      },
      {
        "a": "DEMNORS",
        "p": 2559,
        "ws": [
          {
            "ibh": true,
            "d": "MODERN, a person of modern times or views [n]",
            "bh": "",
            "s": "",
            "w": "MODERNS",
            "fh": "",
            "ifh": false
          },
          {
            "ibh": false,
            "d": "RODSMAN, rodman (a surveyor's assistant) [n]",
            "bh": "",
            "s": "",
            "w": "RODSMEN",
            "fh": "",
            "ifh": false
          }
        ],
        "idx": 26
      },
      {
        "a": "AMORRTY",
        "p": 11145,
        "ws": [
          {
            "ibh": true,
            "d": "containing or resembling mortar [adj]",
            "bh": "",
            "s": "",
            "w": "MORTARY",
            "fh": "",
            "ifh": false
          }
        ],
        "idx": 27
      },
      {
        "a": "CDEFNOR",
        "p": 5735,
        "ws": [
          {
            "ibh": false,
            "d": "fed on corn [adj]",
            "bh": "",
            "s": "",
            "w": "CORNFED",
            "fh": "",
            "ifh": false
          }
        ],
        "idx": 28
      },
      {
        "a": "CDEHHNU",
        "p": 19200,
        "ws": [
          {
            "ibh": false,
            "d": "HUNCH, to arch forward [v]",
            "bh": "",
            "s": "",
            "w": "HUNCHED",
            "fh": "",
            "ifh": false
          }
        ],
        "idx": 29
      },
      {
        "a": "DDEEINT",
        "p": 2563,
        "ws": [
          {
            "ibh": true,
            "d": "ENDITE, to indite (to write or compose) [v]",
            "bh": "",
            "s": "",
            "w": "ENDITED",
            "fh": "",
            "ifh": false
          }
        ],
        "idx": 30
      },
      {
        "a": "ADEIMOW",
        "p": 1709,
        "ws": [
          {
            "ibh": false,
            "d": "MIAOW, to meow (to make the crying sound of a cat) [v]",
            "bh": "",
            "s": "",
            "w": "MIAOWED",
            "fh": "",
            "ifh": false
          }
        ],
        "idx": 31
      },
      {
        "a": "CDEOPRU",
        "p": 8300,
        "ws": [
          {
            "ibh": false,
            "d": "to bring into existence [v PRODUCED, PRODUCING, PRODUCES]",
            "bh": "DRS",
            "s": "",
            "w": "PRODUCE",
            "fh": "",
            "ifh": false
          }
        ],
        "idx": 32
      },
      {
        "a": "AAKMRUZ",
        "p": 19745,
        "ws": [
          {
            "ibh": false,
            "d": "a Polish dance [n MAZURKAS]",
            "bh": "S",
            "s": "",
            "w": "MAZURKA",
            "fh": "",
            "ifh": false
          }
        ],
        "idx": 33
      },
      {
        "a": "ACHHTTY",
        "p": 20706,
        "ws": [
          {
            "ibh": true,
            "d": "resembling thatch [adj THATCHIER, THATCHIEST]",
            "bh": "",
            "s": "",
            "w": "THATCHY",
            "fh": "",
            "ifh": false
          }
        ],
        "idx": 34
      },
      {
        "a": "CEGORSU",
        "p": 6075,
        "ws": [
          {
            "ibh": false,
            "d": "to punish severely [v SCOURGED, SCOURGING, SCOURGES]",
            "bh": "DRS",
            "s": "",
            "w": "SCOURGE",
            "fh": "",
            "ifh": false
          },
          {
            "ibh": false,
            "d": "to crowd (to press into an insufficient space) [v SCROUGED, SCROUGING, SCROUGES]",
            "bh": "DS",
            "s": "",
            "w": "SCROUGE",
            "fh": "",
            "ifh": false
          }
        ],
        "idx": 35
      },
      {
        "a": "ACERRSS",
        "p": 13141,
        "ws": [
          {
            "ibh": false,
            "d": "CRASS, grossly vulgar or stupid [adj]",
            "bh": "",
            "s": "",
            "w": "CRASSER",
            "fh": "",
            "ifh": false
          },
          {
            "ibh": true,
            "d": "SCARER, one that scares (to frighten (to make afraid)) [n]",
            "bh": "",
            "s": "",
            "w": "SCARERS",
            "fh": "",
            "ifh": true
          }
        ],
        "idx": 36
      },
      {
        "a": "ABEOOST",
        "p": 1796,
        "ws": [
          {
            "ibh": false,
            "d": "a waterproof boot [n SEABOOTS]",
            "bh": "S",
            "s": "",
            "w": "SEABOOT",
            "fh": "",
            "ifh": false
          }
        ],
        "idx": 37
      },
      {
        "a": "AEHLNRT",
        "p": 969,
        "ws": [
          {
            "ibh": false,
            "d": "to enthrall (to charm (to attract irresistibly)) [v ENTHRALLED, ENTHRALLING, ENTHRALS]",
            "bh": "LS",
            "s": "",
            "w": "ENTHRAL",
            "fh": "",
            "ifh": false
          }
        ],
        "idx": 38
      },
      {
        "a": "ACDNORU",
        "p": 4008,
        "ws": [
          {
            "ibh": false,
            "d": "candor (frankness; sincerity) [n CANDOURS]",
            "bh": "S",
            "s": "",
            "w": "CANDOUR",
            "fh": "",
            "ifh": false
          }
        ],
        "idx": 39
      },
      {
        "a": "CEERSST",
        "p": 10955,
        "ws": [
          {
            "ibh": false,
            "d": "a metal cup for burning oil [n CRESSETS]",
            "bh": "S",
            "s": "",
            "w": "CRESSET",
            "fh": "",
            "ifh": false
          },
          {
            "ibh": true,
            "d": "RESECT, to excise part of an organ or structure surgically [v]",
            "bh": "",
            "s": "",
            "w": "RESECTS",
            "fh": "",
            "ifh": false
          },
          {
            "ibh": true,
            "d": "SECRET, something kept from the knowledge of others [n]",
            "bh": "",
            "s": "",
            "w": "SECRETS",
            "fh": "",
            "ifh": false
          }
        ],
        "idx": 40
      },
      {
        "a": "GILNOSU",
        "p": 4180,
        "ws": [
          {
            "ibh": false,
            "d": "LOUSE, to spoil or bungle [v]",
            "bh": "",
            "s": "",
            "w": "LOUSING",
            "fh": "B",
            "ifh": false
          }
        ],
        "idx": 41
      },
      {
        "a": "GNOSTUU",
        "p": 12968,
        "ws": [
          {
            "ibh": true,
            "d": "OUTGUN, to surpass in firepower [v]",
            "bh": "",
            "s": "",
            "w": "OUTGUNS",
            "fh": "",
            "ifh": false
          },
          {
            "ibh": false,
            "d": "OUTSING, to surpass in singing [v]",
            "bh": "",
            "s": "",
            "w": "OUTSUNG",
            "fh": "",
            "ifh": false
          }
        ],
        "idx": 42
      },
      {
        "a": "EGHLTUY",
        "p": 14209,
        "ws": [
          {
            "ibh": false,
            "d": "TEUGH, tough (strong and resilient) [adv]",
            "bh": "",
            "s": "",
            "w": "TEUGHLY",
            "fh": "",
            "ifh": false
          }
        ],
        "idx": 43
      },
      {
        "a": "ABDLSUU",
        "p": 17557,
        "ws": [
          {
            "ibh": false,
            "d": "the act of subduing (to bring under control) [n SUBDUALS]",
            "bh": "S",
            "s": "",
            "w": "SUBDUAL",
            "fh": "",
            "ifh": false
          }
        ],
        "idx": 44
      },
      {
        "a": "BIIMNOU",
        "p": 10716,
        "ws": [
          {
            "ibh": false,
            "d": "a metallic element [n NIOBIUMS] : NIOBIC, NIOBOUS ~adj",
            "bh": "S",
            "s": "",
            "w": "NIOBIUM",
            "fh": "",
            "ifh": false
          }
        ],
        "idx": 45
      },
      {
        "a": "CIKNOSW",
        "p": 16435,
        "ws": [
          {
            "ibh": false,
            "d": "the hide of a cow [n COWSKINS]",
            "bh": "S",
            "s": "",
            "w": "COWSKIN",
            "fh": "",
            "ifh": false
          }
        ],
        "idx": 46
      },
      {
        "a": "AAFIRWY",
        "p": 13696,
        "ws": [
          {
            "ibh": false,
            "d": "the mowed part of a golf course between tee and green [n FAIRWAYS]",
            "bh": "S",
            "s": "",
            "w": "FAIRWAY",
            "fh": "",
            "ifh": true
          }
        ],
        "idx": 47
      },
      {
        "a": "BNORSTU",
        "p": 6383,
        "ws": [
          {
            "ibh": true,
            "d": "BURTON, a hoisting tackle [n]",
            "bh": "",
            "s": "",
            "w": "BURTONS",
            "fh": "",
            "ifh": false
          }
        ],
        "idx": 48
      },
      {
        "a": "AAFFIRS",
        "p": 15682,
        "ws": [
          {
            "ibh": true,
            "d": "AFFAIR, anything done or to be done [n]",
            "bh": "",
            "s": "",
            "w": "AFFAIRS",
            "fh": "",
            "ifh": false
          },
          {
            "ibh": true,
            "d": "RAFFIA, a palm tree [n]",
            "bh": "",
            "s": "",
            "w": "RAFFIAS",
            "fh": "",
            "ifh": false
          }
        ],
        "idx": 49
      }
    ],
    "time": 270
  };

  return initialWordwallsData;
});


