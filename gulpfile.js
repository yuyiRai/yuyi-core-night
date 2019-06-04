const gulp = require('gulp')

gulp.task('default', function() {
  gulp.watch('./dist/**/*', function() {
    return gulp.src('./dist/**/*').pipe(
      gulp.dest('D:\\WorkSpace\\MedicalShare\\Foreground\\MedicalShareMP\\node_modules\\yuyi-core-night\\dist\\')
    )
  })
})