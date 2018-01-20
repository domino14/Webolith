class WordListAssertMixin(object):
    def assert_wl(self, word_list, params):
        """
        Assert that the word list params are as stated.
        params - an object that looks like {'numAlphagrams': 11, ...}
        """
        for param, value in params.items():
            self.assertEqual(
                getattr(word_list, param), value,
                msg='Not equal: %s (%s, %s != %s)' % (
                    word_list,
                    param,
                    repr(value),
                    repr(getattr(word_list, param))))
