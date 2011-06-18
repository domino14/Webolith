import sys
from collections import deque
numTotalNodes = 0
import codecs
verbose = False
import struct

class Dawg:
    def __init__(self):
        self.child = None
        self.next = None
        self.letter = None
        self.eow = False    # end of word
        self.nchildren = 0
        self.childDepth = 0
        self.indexInArray = -1
    def __str__(self):
        return repr(self.letter) + " " + repr(self.eow)
        
def addWord(d, word, offset):
    # adds word to the Dawg node d
    global numTotalNodes
    curNode = None
    prevNode = None
    
    if not d.letter:
        d.letter = word[offset]
        curNode = d
        #print offset*' ',curNode, "branch 1"
    else:   # find 'next' node with matching letter
        curNode = d
        while curNode:
            if curNode.letter == word[offset]: break
            #print offset*' ', "finding next..."
            prevNode = curNode
            curNode = curNode.next
            
        if not curNode:
            curNode = Dawg()
            numTotalNodes += 1
            curNode.letter = word[offset]
            prevNode.next = curNode
            #print offset*' ', curNode, "branch 2"
         
        #print offset*' ', curNode, "here"
    
    if offset == len(word) - 1:
        curNode.eow = True
        #print offset*' ', curNode, "eow"
    else:
        if not curNode.child: 
            curNode.child = Dawg()
            numTotalNodes += 1
        #print offset*' ', curNode.child, "new child..."
        addWord(curNode.child, word, offset+1)

def findWord(root, word):
    node = findPartialWord(root, word)
    if node:
        return node.eow
    else:
        return False
        
def findPartialWord(root, partial):
    # returns the node
    curNode = root
    for i in range(len(partial)):
        letter = partial[i]
        #print "finding", letter
        if curNode and curNode.letter:
            letterfound = (curNode.letter == letter)
        else: break
        while not letterfound:
            curNode = curNode.next
            if not curNode: break
            letterfound = (curNode.letter == letter)
            
        if not letterfound: return None
        if i != (len(partial) - 1): curNode = curNode.child
        
    if curNode:
        return curNode
    else:
        return None
    
    #if curNode: return curNode.eow # if it didn't return False it would eventually end up here.
    #else: return False
    
    
    
def extractWords(infile):
    #f = open(infile, 'rb')
    f = codecs.open(infile, 'rb', 'utf-8') 
    # first line is dimension
    words = []
    for line in f:
        splitstr = line.split()
        if len(splitstr) >= 1 and len(splitstr[0]) > 1:
            word = splitstr[0].upper()
            words.append(word)
            
    
    f.close()
    return words

def reverseWords(words):
    # reverses each word in this list
    rwords = [word[::-1] for word in words]
    return rwords
    
def populateDawg(filename):
    f = open(filename, 'rb')
    nodeArray = []
    nodeTable = []

    while True:
        i = f.read(4)
        if i == '': break
        nodeArray.append(struct.unpack('!l', i)[0])
        nodeTable.append(Dawg())

    print "read", len(nodeArray), "nodes"
    for i in range(len(nodeArray)):
        node = nodeTable[i]
        code = nodeArray[i]
        childIndex = code >> 8
        letter = decodeLetter(code & ( (1 << 6) - 1))
        eow = code & ( 1 << 7) > 0
        eon = code & ( 1 << 6) > 0
        if childIndex > 0: node.child = nodeTable[childIndex]
        else: node.child = None
        node.letter = letter
        node.eow = eow
        if eon:
            node.next = None
        else:
            node.next = nodeTable[i + 1]

    if verbose: printNodes(nodeArray)
    return nodeTable[0]
        
def makeDawg(words):
    root = Dawg()
    for word in words:
        addWord(root, word, 0)
    # right now we just have a trie
    return root

def verifyDawg(root, words):
    for word in words:
        found = findWord(root, word)
        if not found: 
            print word, "not found!"
            return False
   
    return True
    
def testDawg():
    words = ['city', 'cities', 'pity', 'pities']
    #words = ['cities', 'city']
    dawg = makeDawg(words)
    if verifyDawg(dawg, words): print "All ok!"
    else: print "Verify failed!"
    
def findHooks(dawg, word):
    hooks = ""
    node = findPartialWord(dawg, word)
    if node:
        # dawg should now be pointing at the end node of the word
        if node.child is None:
            return hooks
        else:
            if node.child.eow:
                hooks += node.child.letter
                sibling = node.child.next
                while sibling:
                    if sibling.eow:
                        hooks += sibling.letter
                    sibling = sibling.next
            
    
    return hooks        
            
             
def assignDawgIndices(dawg):
    # traverse breadth first and assign indices
    index = 0
    nodeTable = []
    nodeArray = []
    # dawg is the root
    queue = deque()
    curNode = dawg
    while curNode:
        queue.append(curNode)
        curNode = curNode.next

    while len(queue) > 0:
        curNode = queue.popleft()
        if curNode.indexInArray == -1: 
            
            curNode.indexInArray = index
            index += 1
            nodeTable.append(curNode)
            nodeArray.append(0)
            curNode = curNode.child
            while curNode:
                queue.append(curNode)
                curNode = curNode.next
        else:
            print "ERROR!"
        
        
    for i in range(len(nodeTable)):
        node = nodeTable[i]
        value = letterMap(node.letter)
        if not node.next:
            value += (1<<6)
        if node.eow:
            value += (1<<7)
        if node.child:
            value += (node.child.indexInArray << 8) 
        nodeArray[i] = value

    if verbose: printNodes(nodeArray)

    return nodeArray

def printNodes(nodeArray):
    print "index\tletter\tchild\teow\teon"
    for i in range(len(nodeArray)):
        print decodeNode(i, nodeArray[i])
        
def decodeNode(index, number):
    child = repr(number >> 8)
     
    if (number & (1 << 6)): eon = True
    else: eon = False
    if (number & (1 << 7)): eow = True
    else: eow = False

    letter = decodeLetter(number & ((1 << 6) - 1))

    return (repr(index) + '\t' + letter + '\t' + repr(child) 
            + '\t' + repr(eow) + '\t' + repr(eon))
    
def decodeLetter(number):
    if number >= 0 and number <= 25: return unichr(ord('A') + number)
    elif number >= 26 and number <=28: return unichr(ord('1') + number - 26)
    elif number == 29: return u'\xf1'
    
def letterMap(letter):
    # map to a 6-bit value (0 to 63)
    if letter >= 'A' and letter <= 'Z': 
        return ord(letter) - ord('A')
    elif letter >= '1' and letter <= '3': 
        return ord(letter) - ord('1') + 26
    else: return 29  # the enye value
    
def writeArray(narray, filename):
    f = open(filename, 'wb')
    for i in narray:
        f.write(struct.pack('!l', i))

    f.close()

def main(*args):  
    global numTotalNodes
    from optparse import OptionParser

    usage = "%prog filename\n where filename is a list of words"
    parser = OptionParser(usage=usage)
    parser.add_option("-v", dest="inputDawgFile", 
                help= "verify existing dawg")
    parser.add_option("-o", dest="outputDawgFile", 
                help="output dawg file")
    parser.add_option("-r", dest="outputDawgRFile",
                help="output reverse dawg file")
    (options, args) = parser.parse_args()
    if (len(args) == 0):
        #parser.print_help()
        parser.error("You must provide a filename in the command line")        
    else:
        print "Provided filename:", args[0]

    
    
    infile = args[0]
    reverse = False
    import time
    t1 = time.time()
    words = extractWords(infile)
    elapsed = time.time() - t1
    print "Extracted words,", elapsed, "s"     


        
   
    if options.outputDawgFile != None:
        numTotalNodes = 1
        t1 = time.time()
        dawg = makeDawg(words)
        print "Made initial trie. Total nodes:", numTotalNodes, "time:", time.time()-t1

        if verifyDawg(dawg, words): print "All ok!"
        else: print "Verify failed!"
        t1 = time.time()
        narray = assignDawgIndices(dawg)
        print "assigned indices", time.time() - t1
        writeArray(narray, options.outputDawgFile)

    if options.outputDawgRFile != None:
        numTotalNodes = 1
        wordsR = reverseWords(words)
        t1 = time.time()
        dawgR = makeDawg(wordsR)
        print "Made initial reverse trie. Total nodes:", numTotalNodes, "time", time.time() - t1

        if verifyDawg(dawgR, wordsR): print "All ok!"
        else: print "Verify failed!"
        t1 = time.time()
        narray = assignDawgIndices(dawgR)
        print "assigned indices", time.time() - t1
        writeArray(narray, options.outputDawgRFile)

    if options.inputDawgFile != None:
        dawg = populateDawg(options.inputDawgFile)
        print "loaded dawg"
        if verifyDawg(dawg, words): print "All ok!"
        else: print "Verify failed!"
    


if __name__ == '__main__':
    main(*sys.argv)
    
