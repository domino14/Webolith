from wordgrids.models import WordgridsTable, WordGrid
from tablegame.models import GenericTableGameModel
import random

letterDist = [9, 2, 2, 4, 12, 2, 3, 2, 9, 1, 1, 4, 2, 6, 8, 2, 1, 6, 4, 6, 4, 2, 2, 1, 2, 1]
letterPool = []
for i in range(len(letterDist)):
    for j in range(letterDist[i]):
        letterPool.append(chr(i + ord('A')))

class WordgridsGame:
    def initializeByChallenge(self, challenge, lexicon, user):
        # does a daily challenge exist with this name and the current date? if not, create it.
        
        try:
            wgt = WordgridsTable.objects.get(lexicon=lexicon, challenge=challenge)
        except WordgridsTable.DoesNotExist:
            # doesn't exist, create it
            # create a wordgrid
            if challenge=='1':
                # 7x7
                gridSize = 7
                timeSecs = 125      # rounded up from 122.5
            elif challenge=='2':
                # 9x9
                gridSize = 9
                timeSecs = 205  # rounded up from 202.5
            elif challenge == '3':
                # 11x11
                gridSize = 11
                timeSecs = 305  # rounded up from 302.5
            
            # generate grid
            letters = self.generateGrid(gridSize, gridSize)
            
            wg = WordGrid(lexicon=lexicon, timeSecs=timeSecs, gridSizeX=gridSize, gridSizeY=gridSize, letters=letters)
            wg.save()
            
            wgt = WordgridsTable(lexicon=lexicon, challenge=challenge, host=user, gameType=GenericTableGameModel.WORDGRIDS_GAMETYPE,
                                    playerType=GenericTableGameModel.MULTIPLAYER_GAME, currentGrid=wg)
            wgt.save()
        
        wgt.inTable.add(user)
        return wgt.pk

    def generateGrid(self, gridSizeX, gridSizeY):
        letters = ""
        for i in range(gridSizeX * gridSizeY):
            letters += random.choice(letterPool)
        
        return letters
               #  
               # if challengeName.name == DailyChallengeName.WEEKS_BINGO_TOUGHIES:
               #     # repeat on Tuesday at midnight local time (ie beginning of the day, 0:00)
               #     # Tuesday is an isoweekday of 2. Find the nearest Tuesday back in time. isoweekday goes from 1 to 7
               #     from wordwalls.management.commands.genMissedBingoChalls import challengeDate
               #     chDate = challengeDate(delta=0)    
               # # otherwise, it's not a 'bingo toughies', but a regular challenge.
               # else:
               #     chDate = datenow
               # 
               # try:
               #     dc = DailyChallenge.objects.get(date=chDate, lexicon=challengeLex, name=challengeName)
               #     # pull out its indices
               # 
               #     pkIndices = json.loads(dc.alphagrams)
               # 
               #     secs = dc.seconds
               #     random.shuffle(pkIndices)
               # except DailyChallenge.DoesNotExist:
               #     # does not exist!
               #     ret = self.generateDailyChallengePks(challengeName, challengeLex, chDate)
               #     if ret:
               #         pkIndices, secs = ret
               #         dc = DailyChallenge(date=chDate, lexicon=challengeLex, name=challengeName, 
               #                 seconds=secs, alphagrams=json.dumps(pkIndices))
               # 
               #         dc.save()
               #     else:
               #         return 0
               # 
               # wgm = self.createGameModelInstance(user, GenericTableGameModel.SINGLEPLAYER_GAME, challengeLex, 
               #                                     len(pkIndices),
               #                                     json.dumps(pkIndices), 
               #                                     len(pkIndices),
               #                                     json.dumps(range(len(pkIndices))), 
               #                                     0,
               #                                     json.dumps([]), 
               #                                     0,
               #                                     json.dumps([]), 
               #                                     gameType='challenge',
               #                                     challengeId=dc.pk,
               #                                     timerSecs=secs)
               # 
               # wgm.save()
               # wgm.inTable.add(user)
               # 
               # 
               # return wgm.pk   # the table number
       