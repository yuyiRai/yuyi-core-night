'use strict';
import shell from 'gulp-shell'
import gulp from 'gulp'
import { paths } from 'yuyi-core-env/config/paths'
import { Task } from 'undertaker';

gulp.task('watch-ttsc', function () {
  gulp.src('src/index.ts')
    .pipe(shell([`ttsc --project ${paths.clintTsConfig} -watch --preserveWatchOutput`]))
})

gulp.task('ttsc', function () {
  return gulp.src('src/index.ts').pipe(
    shell([`ttsc --project ${paths.clintTsConfig} -noEmit false`])
  );
})


export const ttsc = (...init: Task[]) => gulp.series('ttsc', ...init)

export default function(...init: Task[]) {
  return gulp.parallel(gulp.series('ttsc', ...init), 'watch-ttsc')
}