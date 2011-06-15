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
        print os.getpid(), "->trying to lock", lock_name
        self.dbcursor.execute('select get_lock("%s",%s) as lock_success' % (lock_name,
                                                                            self.default_timeout))

        success = ( self.dbcursor.fetchone()[0] == 1 )
        
        if not success:
            raise EnvironmentError, 'Acquiring lock "%s" timed out after %d seconds' % (lock_name, self.default_timeout)
        print os.getpid(), "-->locked", lock_name
        return success
    
    def unlock(self):
        print os.getpid(), "->released", self.get_lock_name()
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
    print os.getpid(), "->trying to lock", lock_name
    dbcursor.execute('select get_lock("%s",%s) as lock_success' % (lock_name,
                                                                        45))

    success = ( dbcursor.fetchone()[0] == 1 )
    
    if not success:
        raise EnvironmentError, 'Acquiring lock "%s" timed out after %d seconds' % (lock_name, 45)
    print os.getpid(), "-->locked", lock_name
    return success
    
def loneunlock(modelName, pk):
    dbcursor = connection.cursor()
    lock_name = '%s|%s' % (modelName.__name__, pk)
    dbcursor.execute('select release_lock("%s")' % lock_name)
    print os.getpid(), "->released", lock_name