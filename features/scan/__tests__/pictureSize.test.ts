import { pickPictureSize } from '../pictureSize';

describe('pickPictureSize', () => {
  it('takes the smallest size that still holds a leaf in detail', () => {
    // A full-size photo was several megabytes over a rural signal; the model reads 224 px.
    expect(pickPictureSize(['4000x3000', '1920x1080', '1280x960', '640x480'])).toBe('1280x960');
  });

  it('ignores sizes too small to see lesions in', () => {
    expect(pickPictureSize(['640x480', '320x240'])).toBeUndefined();
  });

  it('ignores anything it cannot read and copes with nothing at all', () => {
    expect(pickPictureSize(['Photo', 'High', '1600x1200'])).toBe('1600x1200');
    expect(pickPictureSize([])).toBeUndefined();
  });
});
