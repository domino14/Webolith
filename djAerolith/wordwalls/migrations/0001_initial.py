# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):

    def forwards(self, orm):
        
        # Adding model 'DailyChallengeName'
        db.create_table('wordwalls_dailychallengename', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=32)),
        ))
        db.send_create_signal('wordwalls', ['DailyChallengeName'])

        # Adding model 'DailyChallenge'
        db.create_table('wordwalls_dailychallenge', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('lexicon', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['base.Lexicon'])),
            ('date', self.gf('django.db.models.fields.DateField')(auto_now_add=True, blank=True)),
            ('name', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['wordwalls.DailyChallengeName'])),
            ('alphagrams', self.gf('django.db.models.fields.TextField')()),
            ('seconds', self.gf('django.db.models.fields.IntegerField')()),
        ))
        db.send_create_signal('wordwalls', ['DailyChallenge'])

        # Adding unique constraint on 'DailyChallenge', fields ['name', 'lexicon', 'date']
        db.create_unique('wordwalls_dailychallenge', ['name_id', 'lexicon_id', 'date'])

        # Adding model 'DailyChallengeLeaderboard'
        db.create_table('wordwalls_dailychallengeleaderboard', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('challenge', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['wordwalls.DailyChallenge'], unique=True)),
            ('maxScore', self.gf('django.db.models.fields.IntegerField')()),
        ))
        db.send_create_signal('wordwalls', ['DailyChallengeLeaderboard'])

        # Adding model 'DailyChallengeLeaderboardEntry'
        db.create_table('wordwalls_dailychallengeleaderboardentry', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('board', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['wordwalls.DailyChallengeLeaderboard'])),
            ('user', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['auth.User'])),
            ('score', self.gf('django.db.models.fields.IntegerField')()),
            ('timeRemaining', self.gf('django.db.models.fields.IntegerField')()),
        ))
        db.send_create_signal('wordwalls', ['DailyChallengeLeaderboardEntry'])

        # Adding unique constraint on 'DailyChallengeLeaderboardEntry', fields ['board', 'user']
        db.create_unique('wordwalls_dailychallengeleaderboardentry', ['board_id', 'user_id'])

        # Adding model 'SavedList'
        db.create_table('wordwalls_savedlist', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('lexicon', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['base.Lexicon'])),
            ('created', self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, blank=True)),
            ('lastSaved', self.gf('django.db.models.fields.DateTimeField')(auto_now=True, auto_now_add=True, blank=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('user', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['auth.User'])),
            ('numAlphagrams', self.gf('django.db.models.fields.IntegerField')()),
            ('numCurAlphagrams', self.gf('django.db.models.fields.IntegerField')()),
            ('numFirstMissed', self.gf('django.db.models.fields.IntegerField')()),
            ('numMissed', self.gf('django.db.models.fields.IntegerField')()),
            ('goneThruOnce', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('questionIndex', self.gf('django.db.models.fields.IntegerField')()),
            ('origQuestions', self.gf('django.db.models.fields.TextField')()),
            ('curQuestions', self.gf('django.db.models.fields.TextField')()),
            ('missed', self.gf('django.db.models.fields.TextField')()),
            ('firstMissed', self.gf('django.db.models.fields.TextField')()),
        ))
        db.send_create_signal('wordwalls', ['SavedList'])

        # Adding model 'WordwallsGameModel'
        db.create_table('wordwalls_wordwallsgamemodel', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('lexicon', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['base.Lexicon'])),
            ('host', self.gf('django.db.models.fields.related.ForeignKey')(related_name='host', to=orm['auth.User'])),
            ('lastActivity', self.gf('django.db.models.fields.DateTimeField')(auto_now=True, blank=True)),
            ('currentGameState', self.gf('django.db.models.fields.TextField')()),
            ('gameType', self.gf('django.db.models.fields.IntegerField')()),
            ('playerType', self.gf('django.db.models.fields.IntegerField')()),
            ('numOrigQuestions', self.gf('django.db.models.fields.IntegerField')()),
            ('origQuestions', self.gf('django.db.models.fields.TextField')()),
            ('numCurQuestions', self.gf('django.db.models.fields.IntegerField')()),
            ('curQuestions', self.gf('django.db.models.fields.TextField')()),
            ('numMissed', self.gf('django.db.models.fields.IntegerField')()),
            ('missed', self.gf('django.db.models.fields.TextField')()),
            ('numFirstMissed', self.gf('django.db.models.fields.IntegerField')()),
            ('firstMissed', self.gf('django.db.models.fields.TextField')()),
        ))
        db.send_create_signal('wordwalls', ['WordwallsGameModel'])

        # Adding M2M table for field inTable on 'WordwallsGameModel'
        db.create_table('wordwalls_wordwallsgamemodel_inTable', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('wordwallsgamemodel', models.ForeignKey(orm['wordwalls.wordwallsgamemodel'], null=False)),
            ('user', models.ForeignKey(orm['auth.user'], null=False))
        ))
        db.create_unique('wordwalls_wordwallsgamemodel_inTable', ['wordwallsgamemodel_id', 'user_id'])

        # Adding model 'DailyChallengeMissedBingos'
        db.create_table('wordwalls_dailychallengemissedbingos', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('challenge', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['wordwalls.DailyChallenge'])),
            ('alphagram', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['base.Alphagram'])),
            ('numTimesMissed', self.gf('django.db.models.fields.IntegerField')()),
        ))
        db.send_create_signal('wordwalls', ['DailyChallengeMissedBingos'])

        # Adding unique constraint on 'DailyChallengeMissedBingos', fields ['challenge', 'alphagram']
        db.create_unique('wordwalls_dailychallengemissedbingos', ['challenge_id', 'alphagram_id'])


    def backwards(self, orm):
        
        # Removing unique constraint on 'DailyChallengeMissedBingos', fields ['challenge', 'alphagram']
        db.delete_unique('wordwalls_dailychallengemissedbingos', ['challenge_id', 'alphagram_id'])

        # Removing unique constraint on 'DailyChallengeLeaderboardEntry', fields ['board', 'user']
        db.delete_unique('wordwalls_dailychallengeleaderboardentry', ['board_id', 'user_id'])

        # Removing unique constraint on 'DailyChallenge', fields ['name', 'lexicon', 'date']
        db.delete_unique('wordwalls_dailychallenge', ['name_id', 'lexicon_id', 'date'])

        # Deleting model 'DailyChallengeName'
        db.delete_table('wordwalls_dailychallengename')

        # Deleting model 'DailyChallenge'
        db.delete_table('wordwalls_dailychallenge')

        # Deleting model 'DailyChallengeLeaderboard'
        db.delete_table('wordwalls_dailychallengeleaderboard')

        # Deleting model 'DailyChallengeLeaderboardEntry'
        db.delete_table('wordwalls_dailychallengeleaderboardentry')

        # Deleting model 'SavedList'
        db.delete_table('wordwalls_savedlist')

        # Deleting model 'WordwallsGameModel'
        db.delete_table('wordwalls_wordwallsgamemodel')

        # Removing M2M table for field inTable on 'WordwallsGameModel'
        db.delete_table('wordwalls_wordwallsgamemodel_inTable')

        # Deleting model 'DailyChallengeMissedBingos'
        db.delete_table('wordwalls_dailychallengemissedbingos')


    models = {
        'auth.group': {
            'Meta': {'object_name': 'Group'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '80'}),
            'permissions': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.Permission']", 'symmetrical': 'False', 'blank': 'True'})
        },
        'auth.permission': {
            'Meta': {'ordering': "('content_type__app_label', 'content_type__model', 'codename')", 'unique_together': "(('content_type', 'codename'),)", 'object_name': 'Permission'},
            'codename': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'content_type': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['contenttypes.ContentType']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        },
        'auth.user': {
            'Meta': {'object_name': 'User'},
            'date_joined': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'email': ('django.db.models.fields.EmailField', [], {'max_length': '75', 'blank': 'True'}),
            'first_name': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'}),
            'groups': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.Group']", 'symmetrical': 'False', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'is_active': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'is_staff': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'is_superuser': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'last_login': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'last_name': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'}),
            'password': ('django.db.models.fields.CharField', [], {'max_length': '128'}),
            'user_permissions': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.Permission']", 'symmetrical': 'False', 'blank': 'True'}),
            'username': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '30'})
        },
        'base.alphagram': {
            'Meta': {'unique_together': "(('alphagram', 'lexicon'), ('probability', 'length', 'lexicon'))", 'object_name': 'Alphagram'},
            'alphagram': ('django.db.models.fields.CharField', [], {'max_length': '15'}),
            'length': ('django.db.models.fields.IntegerField', [], {}),
            'lexicon': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['base.Lexicon']"}),
            'probability': ('django.db.models.fields.IntegerField', [], {}),
            'probability_pk': ('django.db.models.fields.IntegerField', [], {'primary_key': 'True'})
        },
        'base.lexicon': {
            'Meta': {'object_name': 'Lexicon'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'lengthCounts': ('django.db.models.fields.CharField', [], {'max_length': '256'}),
            'lexiconDescription': ('django.db.models.fields.CharField', [], {'max_length': '64'}),
            'lexiconName': ('django.db.models.fields.CharField', [], {'max_length': '12'})
        },
        'contenttypes.contenttype': {
            'Meta': {'ordering': "('name',)", 'unique_together': "(('app_label', 'model'),)", 'object_name': 'ContentType', 'db_table': "'django_content_type'"},
            'app_label': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'model': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100'})
        },
        'wordwalls.dailychallenge': {
            'Meta': {'unique_together': "(('name', 'lexicon', 'date'),)", 'object_name': 'DailyChallenge'},
            'alphagrams': ('django.db.models.fields.TextField', [], {}),
            'date': ('django.db.models.fields.DateField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'lexicon': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['base.Lexicon']"}),
            'name': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['wordwalls.DailyChallengeName']"}),
            'seconds': ('django.db.models.fields.IntegerField', [], {})
        },
        'wordwalls.dailychallengeleaderboard': {
            'Meta': {'object_name': 'DailyChallengeLeaderboard'},
            'challenge': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['wordwalls.DailyChallenge']", 'unique': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'maxScore': ('django.db.models.fields.IntegerField', [], {})
        },
        'wordwalls.dailychallengeleaderboardentry': {
            'Meta': {'unique_together': "(('board', 'user'),)", 'object_name': 'DailyChallengeLeaderboardEntry'},
            'board': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['wordwalls.DailyChallengeLeaderboard']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'score': ('django.db.models.fields.IntegerField', [], {}),
            'timeRemaining': ('django.db.models.fields.IntegerField', [], {}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.User']"})
        },
        'wordwalls.dailychallengemissedbingos': {
            'Meta': {'unique_together': "(('challenge', 'alphagram'),)", 'object_name': 'DailyChallengeMissedBingos'},
            'alphagram': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['base.Alphagram']"}),
            'challenge': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['wordwalls.DailyChallenge']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'numTimesMissed': ('django.db.models.fields.IntegerField', [], {})
        },
        'wordwalls.dailychallengename': {
            'Meta': {'object_name': 'DailyChallengeName'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '32'})
        },
        'wordwalls.savedlist': {
            'Meta': {'object_name': 'SavedList'},
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'curQuestions': ('django.db.models.fields.TextField', [], {}),
            'firstMissed': ('django.db.models.fields.TextField', [], {}),
            'goneThruOnce': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'lastSaved': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'auto_now_add': 'True', 'blank': 'True'}),
            'lexicon': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['base.Lexicon']"}),
            'missed': ('django.db.models.fields.TextField', [], {}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'numAlphagrams': ('django.db.models.fields.IntegerField', [], {}),
            'numCurAlphagrams': ('django.db.models.fields.IntegerField', [], {}),
            'numFirstMissed': ('django.db.models.fields.IntegerField', [], {}),
            'numMissed': ('django.db.models.fields.IntegerField', [], {}),
            'origQuestions': ('django.db.models.fields.TextField', [], {}),
            'questionIndex': ('django.db.models.fields.IntegerField', [], {}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.User']"})
        },
        'wordwalls.wordwallsgamemodel': {
            'Meta': {'object_name': 'WordwallsGameModel'},
            'curQuestions': ('django.db.models.fields.TextField', [], {}),
            'currentGameState': ('django.db.models.fields.TextField', [], {}),
            'firstMissed': ('django.db.models.fields.TextField', [], {}),
            'gameType': ('django.db.models.fields.IntegerField', [], {}),
            'host': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'host'", 'to': "orm['auth.User']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'inTable': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'inTable'", 'symmetrical': 'False', 'to': "orm['auth.User']"}),
            'lastActivity': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'lexicon': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['base.Lexicon']"}),
            'missed': ('django.db.models.fields.TextField', [], {}),
            'numCurQuestions': ('django.db.models.fields.IntegerField', [], {}),
            'numFirstMissed': ('django.db.models.fields.IntegerField', [], {}),
            'numMissed': ('django.db.models.fields.IntegerField', [], {}),
            'numOrigQuestions': ('django.db.models.fields.IntegerField', [], {}),
            'origQuestions': ('django.db.models.fields.TextField', [], {}),
            'playerType': ('django.db.models.fields.IntegerField', [], {})
        }
    }

    complete_apps = ['wordwalls']
