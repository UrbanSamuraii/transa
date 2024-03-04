import { HttpException, HttpStatus } from '@nestjs/common';

export const imageFileFilter = (req, file, callback) => {
    if (!file.originalname.match(/\.(png)$/)) {
        return callback(new HttpException('Only .png files are allowed!', HttpStatus.BAD_REQUEST), false);
    }
    callback(null, true);
};
