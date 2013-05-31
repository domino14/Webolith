# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):

    def forwards(self, orm):
        
        # Adding model 'Lexicon'
        db.create_table('base_lexicon', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('lexiconName', self.gf('django.db.models.fields.CharField')(max_length=12)),
            ('lexiconDescription', self.gf('django.db.models.fields.CharField')(max_length=64)),
            ('lengthCounts', self.gf('django.db.models.fields.CharField')(max_length=256)),
        ))
        db.send_create_signal('base', ['Lexicon'])

        # Adding model 'Alphagram'
        db.create_table('base_alphagram', (
            ('alphagram', self.gf('django.db.models.fields.CharField')(max_length=15)),
            ('lexicon', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['base.Lexicon'])),
            ('probability', self.gf('django.db.models.fields.IntegerField')()),
            ('probability_pk', self.gf('django.db.models.fields.IntegerField')(primary_key=True)),
            ('length', self.gf('django.db.models.fields.IntegerField')()),
        ))
        db.send_create_signal('base', ['Alphagram'])

        # Adding unique constraint on 'Alphagram', fields ['alphagram', 'lexicon']
        db.create_unique('base_alphagram', ['alphagram', 'lexicon_id'])

        # Adding unique constraint on 'Alphagram', fields ['probability', 'length', 'lexicon']
        db.create_unique('base_alphagram', ['probability', 'length', 'lexicon_id'])

        # Adding model 'Word'
        db.create_table('base_word', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('word', self.gf('django.db.models.fields.CharField')(max_length=15)),
            ('alphagram', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['base.Alphagram'])),
            ('lexicon', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['base.Lexicon'])),
            ('lexiconSymbols', self.gf('django.db.models.fields.CharField')(max_length=5)),
            ('definition', self.gf('django.db.models.fields.CharField')(max_length=512)),
            ('front_hooks', self.gf('django.db.models.fields.CharField')(max_length=26)),
            ('back_hooks', self.gf('django.db.models.fields.CharField')(max_length=26)),
        ))
        db.send_create_signal('base', ['Word'])


    def backwards(self, orm):
        
        # Removing unique constraint on 'Alphagram', fields ['probability', 'length', 'lexicon']
        db.delete_unique('base_alphagram', ['probability', 'length', 'lexicon_id'])

        # Removing unique constraint on 'Alphagram', fields ['alphagram', 'lexicon']
        db.delete_unique('base_alphagram', ['alphagram', 'lexicon_id'])

        # Deleting model 'Lexicon'
        db.delete_table('base_lexicon')

        # Deleting model 'Alphagram'
        db.delete_table('base_alphagram')

        # Deleting model 'Word'
        db.delete_table('base_word')


    models = {
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
        'base.word': {
            'Meta': {'object_name': 'Word'},
            'alphagram': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['base.Alphagram']"}),
            'back_hooks': ('django.db.models.fields.CharField', [], {'max_length': '26'}),
            'definition': ('django.db.models.fields.CharField', [], {'max_length': '512'}),
            'front_hooks': ('django.db.models.fields.CharField', [], {'max_length': '26'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'lexicon': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['base.Lexicon']"}),
            'lexiconSymbols': ('django.db.models.fields.CharField', [], {'max_length': '5'}),
            'word': ('django.db.models.fields.CharField', [], {'max_length': '15'})
        }
    }

    complete_apps = ['base']
