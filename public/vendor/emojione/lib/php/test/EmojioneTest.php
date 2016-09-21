<?php

namespace Emojione\Test;

use Emojione\Emojione;

class EmojioneTest extends \PHPUnit_Framework_TestCase
{

    private $cacheBustParam = '?v=2.2.5';

    /**
     * test Emojione::toImage()
     *
     * @return void
     */
    public function testToImage()
    {
        $test     = 'Hello world! 😄 :smile:';
        $expected = 'Hello world! <img class="emojione" alt="😄" src="//cdn.jsdelivr.net/emojione/assets/png/1f604.png' . $this->cacheBustParam . '"/> <img class="emojione" alt="&#x1f604;" src="//cdn.jsdelivr.net/emojione/assets/png/1f604.png' . $this->cacheBustParam . '"/>';

        $this->assertEquals(Emojione::toImage($test), $expected);
    }

    /**
     * test Emojione::unifyUnicode()
     *
     * @return void
     */
    public function testUnifyUnicode()
    {
        $test     = 'Hello world! 😄 :smile:';
        $expected = 'Hello world! 😄 😄';

        $this->assertEquals(Emojione::unifyUnicode($test), $expected);
    }

    /**
     * test Emojione::shortnameToUnicode()
     *
     * @return void
     */
    public function testShortnameToUnicode()
    {
        $test     = 'Hello world! 😄 :smile:';
        $expected = 'Hello world! 😄 😄';

        $this->assertEquals(Emojione::shortnameToUnicode($test), $expected);
    }


    /**
     * test Emojione::shortnameToAscii()
     *
     * @return void
     */
    public function testShortnameToAscii()
    {
        $test     = 'Hello world! 🙂 :slight_smile:';
        $expected = 'Hello world! 🙂 :]';

        $this->assertEquals(Emojione::shortnameToAscii($test), $expected);
    }

    /**
     * test Emojione::shortnameToImage()
     *
     * @return void
     */
    public function testShortnameToImage()
    {
        $test     = 'Hello world! 😄 :smile:';
        $expected = 'Hello world! 😄 <img class="emojione" alt="&#x1f604;" src="//cdn.jsdelivr.net/emojione/assets/png/1f604.png' . $this->cacheBustParam . '"/>';

        $this->assertEquals(Emojione::shortnameToImage($test), $expected);
    }

    /**
     * test Emojione::toShort()
     *
     * @return void
     */
    public function testToShort()
    {
        $test     = 'Hello world! 😄 :smile:';
        $expected = 'Hello world! :smile: :smile:';

        $this->assertEquals(Emojione::toShort($test), $expected);
    }

    /**
     * test Emojione::unicodeToImage()
     *
     * @return void
     */
    public function testUnicodeToImage()
    {
        $test     = 'Hello world! 😄 :smile:';
        $expected = 'Hello world! <img class="emojione" alt="😄" src="//cdn.jsdelivr.net/emojione/assets/png/1f604.png' . $this->cacheBustParam . '"/> :smile:';

        $this->assertEquals(Emojione::unicodeToImage($test), $expected);
    }
}
