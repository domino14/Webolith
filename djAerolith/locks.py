# Aerolith 2.0: A web-based word game website
# Copyright (C) 2011 Cesar Del Solar
# 
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
# 
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
# 
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.

# To contact the author, please email delsolar at gmail dot com

from django.db import connection
import os
class LockableObject(object):

    default_timeout = 45

    def __init__(self, *args, **kwargs):
        
        super(LockableObject, self).__init__(*args, **kwargs)
        
        self.dbcursor = connection.cursor()
        self.lock_id = None
        
    def get_lock_name(self):
        return '%s|%s' % (self.__class__.__name__,
                          self.lock_id)
    
    def lock(self):

        if hasattr(self, 'id'):
            self.lock_id = self.id
        else:
            self.lock_id = 0
            
        lock_name = self.get_lock_name()
        self.dbcursor.execute('select get_lock("%s",%s) as lock_success' % (lock_name,
                                                                            self.default_timeout))

        success = ( self.dbcursor.fetchone()[0] == 1 )
        
        if not success:
            raise EnvironmentError, 'Acquiring lock "%s" timed out after %d seconds' % (lock_name, self.default_timeout)
        return success
    
    def unlock(self):
        self.dbcursor.execute('select release_lock("%s")' % self.get_lock_name())
        

def require_object_lock(func):
    
    def wrapped(*args, **kwargs):

        lock_object = args[0]
        
        lock_object.lock()

        try:
            return func(*args, **kwargs)
        finally:
            lock_object.unlock()
        
    return wrapped
    
def lonelock(modelName, pk):
    dbcursor = connection.cursor()

    lock_name = '%s|%s' % (modelName.__name__, pk)
    dbcursor.execute('select get_lock("%s",%s) as lock_success' % (lock_name,
                                                                        45))

    success = ( dbcursor.fetchone()[0] == 1 )
    
    if not success:
        raise EnvironmentError, 'Acquiring lock "%s" timed out after %d seconds' % (lock_name, 45)
    return success
    
def loneunlock(modelName, pk):
    dbcursor = connection.cursor()
    lock_name = '%s|%s' % (modelName.__name__, pk)
    dbcursor.execute('select release_lock("%s")' % lock_name)
