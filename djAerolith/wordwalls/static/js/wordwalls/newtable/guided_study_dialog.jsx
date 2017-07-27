import React from 'react';


const Accordion = props => (
  <div
    className="panel-group"
    role="tablist"
    aria-multiselectable="true"
    id={props.domID}
  >
    {props.children}
  </div>
);

Accordion.propTypes = {
  children: React.PropTypes.node,
  domID: React.PropTypes.string,
};

const AccordionChild = props => (
  <div className="panel panel-default">
    <div className="panel-heading" role="tab" id={`heading-${props.shortname}`}>
      <h4 className="panel-title">
        <a
          role="button"
          className="collapsed"
          data-toggle="collapse"
          data-parent={props.accordionSelector}
          href={`#collapse-${props.shortname}`}
          aria-expanded="false"
          aria-controls={`collapse-${props.shortname}`}
        >{props.title}
        </a>
      </h4>
    </div>
    <div
      id={`collapse-${props.shortname}`}
      className="panel-collapse collapse"
      role="tabpanel"
      aria-labelledby={`heading-${props.shortname}`}
    >
      <div className="panel-body">
        {props.children}
      </div>
    </div>
  </div>
);

AccordionChild.propTypes = {
  children: React.PropTypes.node,
  shortname: React.PropTypes.string,
  accordionSelector: React.PropTypes.string,
  title: React.PropTypes.string,
};

const GuidedStudyDialog = () => (
  <div>
    <div className="row">
      <div className="col-sm-12">
        <p>There are many ways to start studying Scrabble words. Many follow
        the same pattern. The following is a pattern I suggest. These words
        are in order of most important to least important.</p>
        <Accordion domID="guided-study">
          <AccordionChild
            title="The Twos"
            shortname="twos"
            accordionSelector="#guided-study"
          >
            <p>
            The two-letter words are the most important words in the game. Luckily,
            there&apos;s not too many of them!
            </p>
            <p>
            Learning the twos from scratch should just take a couple of hours and they
            will boost your average Scrabble score by 50 points or more.
            </p>
          </AccordionChild>
          <AccordionChild
            title="Two-to-make-Threes"
            shortname="2-to-3s"
            accordionSelector="#guided-study"
          >
            These are hooks, or letters that can go on either side of a two-letter word
            to make a three-letter word. For example, you can put an E or an S on the end of
            BY to make BYE or BYS, or you can put an A on the beginning of BY to make ABY.
          </AccordionChild>
          <AccordionChild
            title="Vowel-dump 4s and 5s"
            shortname="vowel-dump-4s-5s"
            accordionSelector="#guided-study"
          >
            Words with lots of vowels are important to know. It is easy to get a vowel-heavy
            rack and being able to play some of them off rather than having to exchange,
            or keeping a bad rack, is very important.
          </AccordionChild>
          <AccordionChild
            title="JQXZ 4s and 5s"
            shortname="jqxz-dump-4s-5s"
            accordionSelector="#guided-study"
          >
            Short words containing J, Q, X, and Z pop up frequently. These words
            are not in many bingos, and these sometimes unwieldy tiles can score
            a lot of points with a short word.
          </AccordionChild>
          <AccordionChild
            title="Top 3 6-to-7 letter stems"
            shortname="top-6-to-7-letter-stems"
            accordionSelector="#guided-study"
          >
            <p>A stem is a set of letters that make a bingo when you add 1 or 2 more
            letters to it. A bingo is when you play all 7 tiles in your rack
            in one turn, and they are amongst the most important words to learn, as
            playing a bingo nets you an automatic 50-point bonus. The top Scrabble players
            average over two bingos per game.</p>
            <p>The top 3 six-to-seven letter stems include AEINST, AEIRST, and AEINRT.
            People usually refer to these as SATINE*, SATIRE, and RETINA.</p>
            <p>SATINE* itself is not a valid Scrabble word, but it makes at least
            one valid bingo with every letter except the Q and the Y! That is 91
            of the remaining 94 tiles. For example, with A, it makes ENTASIA and TAENIAS,
            with B, it makes BASINET and BANTIES, etc.</p>
          </AccordionChild>
          <AccordionChild
            title="Top 3 7-to-8-letter stems"
            shortname="top-7-to-8-letter-stems"
            accordionSelector="#guided-study"
          >
            <p>As in the discussion for 6-to-7 letter stems, there are also 7-to-8 letter
            stems. These are RETAINS, ORIENTS, and RETINA-O. (In Collins, OTARIES# is
            the third best stem).</p>
          </AccordionChild>
          <AccordionChild
            title="The threes"
            shortname="the-threes"
          >
            <p>Learn the remainder of the 3-letter words - these pop up in all places and
            are almost as important as the 2s.</p>
          </AccordionChild>
        </Accordion>
      </div>
    </div>
    <div className="row">
      <div className="col-sm-12">
        <p>Knowing the above words well will get you far. You should be able to
        get your Scrabble rating over 1000 with this basis and practice. Remember
        to keep good leaves and not overly fish for bingos (many players tend to do
        this with stems).
        </p>
      </div>
    </div>
  </div>
);

export default GuidedStudyDialog;
