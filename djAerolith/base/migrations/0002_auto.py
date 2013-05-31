# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):

    def forwards(self, orm):
        
        # Adding index on 'Word', fields ['word']
        db.create_index('base_word', ['word'])


    def backwards(self, orm):
        
        # Removing index on 'Word', fields ['word']
        db.delete_index('base_word', ['word'])


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
            'word': ('django.db.models.fields.CharField', [], {'max_length': '15', 'db_index': 'True'})
        }
    }

    complete_apps = ['base']
