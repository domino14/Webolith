# chew's reference: http://www.poslfit.com/scrabble/gcg/
import uuid
import re


class GCGParseError(Exception):
    pass


class GCGParser:
    """ Parses a .gcg file and outputs a python object in a format I
    invented. Not all .gcg options are supported; this should not be
    taken as a reference parser. Unsupported options are listed here:

        rack1, rack2, incomplete pragmas

    """
    mustPreceedEventPragmas = ['player1', 'player2', 'title', 'description']
    acceptedLexica = ['ODS', 'ODS2', 'ODS3', 'ODS4', 'ODS5', 'OSPD', 'OSPD2',
                      'OSPD3', 'OSPD4', 'OTCWL', 'OTCWL2']

    def parse(self, gcg):
        """ gcg is a string representing a .gcg file """
        output = {'players': {},
                  'title': '',
                  'description': '',
                  'id': '',
                  'lexicon': 'OTCWL2',
                  'moves': []}

        lines = [line.strip() for line in gcg.split('\n')]
        for line in lines:
            if line.startswith('#'):
                self.processPragma(line, output)
            elif line.startswith('>'):
                self.processEvent(line, output)
            elif len(line) == 0:
                continue
            else:
                raise GCGParseError('File has an unrecognized line beginning')
        if output['id'] == '':
            # auto-assign an id
            output['id'] = 'org.aerolith %s' % uuid.uuid4()

        return output

    def processPragma(self, line, output):
        try:
            pragma, params = line[1:].split(' ', 1)
        except ValueError:
            raise GCGParseError('Malformed pragma: %s' % line)

        # check if pragma preceeds any event lines
        if pragma in self.mustPreceedEventPragmas and len(output['moves']) > 0:
            raise GCGParseError('Pragma must preceed event lines: %s' % pragma)

        if pragma == 'player1' or pragma == 'player2':
            nickname, fullname = params.split(' ', 1)
            playernumber = pragma[-1]
            output['players'][nickname] = {'order': int(playernumber),
                                           'nickname': nickname,
                                           'fullname': fullname}
        elif pragma == 'title':
            output['title'] = params
        elif pragma == 'description':
            output['description'] = params
        elif pragma == 'id':
            output['id'] = id
        elif pragma == 'lexicon':
            if params in self.acceptedLexica:
                output['lexicon'] = params
            else:
                raise GCGParseError('Unsupported lexicon: %s' % params)
        elif pragma == 'note' or pragma == 'comment':
            # assume that move is the last move in 'output'
            try:
                move = output['moves'][-1]
            except IndexError:
                raise GCGParseError('#%s has no move attached to it' % pragma)

            move[pragma] = params

    def processEvent(self, line, output):
        try:
            name, params = line[1:].split(' ', 1)
        except ValueError:
            raise GCGParseError('Malformed event: %s' % line)

        if not name.endswith(':'):
            raise GCGParseError('Malformed event: %s' % line)

        name = name[:-1]
        if name not in output['players']:
            raise GCGParseError('Name %s not found in player pragmata' % name)

        params = params.split()
        # rack is always first
        rack = params[0]
        directive = params[1]
        eventParams = params[2:]
        # check if direcitve is a coordinate position (like O15)
        pos = self.position(directive)
        event = {'rack': rack,
                 'player': name}
        if not pos:
            # can be a few things
            try:
                self.processNonPlayEvent(event, rack, directive, eventParams)
            except IndexError:
                raise GCGParseError('Event is not properly formatted: %s' %
                                    line)
        else:
            # this is a regular play
            event['event'] = 'play'
            event['row'] = pos[0]
            event['column'] = pos[1]
            event['direction'] = pos[2]
            event['coordinates'] = directive
            event['play'] = eventParams[0]
            event['score'] = int(eventParams[1])
            event['totalscore'] = int(eventParams[2])

        event['originalevent'] = params
        output['moves'].append(event)

    def position(self, directive):
        """ checks if the directive passed in is a coordinate position """
        verticalRegex = '(?P<column>^[a-yA-Y])(?P<row>[1-9][0-9]?$)'
        horizontalRegex = '(?P<row>^[1-9][0-9]?)(?P<column>[a-yA-Y]$)'
        m = re.match(horizontalRegex, directive)
        if m:
            return m.group('row'), m.group('column'), 'horizontal'
        m = re.match(verticalRegex, directive)
        if m:
            return m.group('row'), m.group('column'), 'vertical'

        return None

    def processNonPlayEvent(self, event, rack, directive, eventParams):
        if directive == '-' and eventParams[0] == '+0':
            # passed turn
            event['event'] = 'passedturn'
            event['score'] = '+0'
            event['totalscore'] = int(eventParams[1])
        elif directive == '--':
            # withdrawn phoney
            event['event'] = 'withdrawnphoney'
            event['score'] = int(eventParams[0])
            event['totalscore'] = int(eventParams[1])
        elif directive.startswith('-'):
            # exchange
            event['event'] = 'exchange'
            event['tiles'] = directive[1:]
            event['score'] = 0
            event['totalscore'] = int(eventParams[1])
        elif directive == '(challenge)':
            # bonus for challenged, acceptable word
            event['event'] = 'challengebonus'
            event['score'] = int(eventParams[0])
            event['totalscore'] = int(eventParams[1])
        elif (directive.startswith('+') and rack.startswith('(') and
                rack.endswith(')')):
            # points scored for opp's last rack
            event['event'] = 'lastrackbonus'
            event['score'] = int(directive)
            event['totalscore'] = int(eventParams[0])
        elif directive == '(time)':
            # time penalty
            event['event'] = 'timepenalty'
            event['score'] = int(eventParams[0])
            event['totalscore'] = int(eventParams[1])
        elif directive == '(%s)' % rack:
            # points lost for last rack (international rules)
            event['event'] = 'lastrackpenalty'
            event['score'] = int(eventParams[0])
            event['totalscore'] = int(eventParams[1])


x = """
#player1 cesar cesar
#player2 roy roy

>cesar: DGILOSU 8D GUILD +18 18

>roy: III -III +0 0
>cesar: ALOSSYZ E5 SOY.Z +34 52
#note gyoza vs soyuz, very close.
>roy: ??AADER I2 ARcADEs +65 65
>cesar: AELOSWX F5 OX +52 104
>roy: BEEEIPR 6I .EE +6 71
>cesar: AAELLSW K5 S.AWALL +40 144
#note LOL!!!!!!! -25
>roy: EINORTU 10H OUT.INER +62 133
>cesar: BEIINNV O5 VINIE. +27 171
>roy: DEEKOV 3I .EVOKED +30 163
>cesar: BDGMMNR 2G GR.M +23 194
>roy: ACEFIOS 2N FE +23 186
>cesar: ABDHMNN N6 HAM +35 229
#note i'm too chicken. take the extra 5 pts and stop worrying about the Q. although it only being 2.5 equity point mistake implies i'm slightly right.
>roy: AFU M7 FAU. +27 213
>cesar: BDHIJNN 4L HIN +34 263
#note this should be a bigger mistake. OF COURSE DJINN is right. what am I doing? gah. -5
>roy: AELQSSU 11B SQUEALS +84 297
>cesar: BCDIJNN F10 J.B +28 291
>roy: CEEOO B6 COOEE. +16 313
>cesar: CDINNOR A8 DON +25 316
>roy: EINRRTT 12C IT +19 332
>cesar: BCGINOR D6 BO. +23 339
#note BED is probably better. i still have COG potentially. gah! -0.5
>roy: AET 1F TAE +18 350
>cesar: CGINRRT J5 R.T +9 348
#note how to play an endgame: see what he could have that could hurt you most and play there. I can't let him have WED. BOXY sucks too, which is why I wanted to play two tiles, but WED hurts more, plus he'll have an awkward W. -8.5%
>roy: W O1 W.. +21 371
>cesar: CGIINPR 4F PI +16 364
#note no way to win this anymore. -2 CUT
>roy: AINPTTY 6D ...Y +16 387
>cesar: CGINNR G11 .ING +10 374
>roy: AIPRTT 14G .RIPT +14 401
>cesar: CNR 5E ..C +13 387
>cesar: CNR --  -13 374
>roy: AT H13 A.T +11 412
>roy:  (CNR) +10 422
"""

y = """
#player1 David David
#player2 Randy Randy
>David: ANTHER? n8 ANoTHER +73 416
>Randy: U - +0 380
>David: SEQSPO? -QO +0 268
>Randy: MOULAGD -- -76 354
>David: DROWNUG (challenge) +5 289
>Randy: (G) +4 539
>Randy: FWLI (FWLI) -10 426
>David: ISBALI (time) -10 409
"""

if __name__ == '__main__':
    parser = GCGParser()
    print parser.parse(y)
