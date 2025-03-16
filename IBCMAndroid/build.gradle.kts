// Top-level build file where you can add configuration options common to all sub-projects/modules.
buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath(libs.plugins.androidApplication.get().pluginId)
        classpath(libs.plugins.kotlinAndroid.get().pluginId)
        classpath(libs.plugins.hilt.get().pluginId)
        classpath(libs.plugins.googleServices.get().pluginId)
    }
}

plugins {
    alias(libs.plugins.androidApplication) apply false
    alias(libs.plugins.kotlinAndroid) apply false
    alias(libs.plugins.kotlinKapt) apply false
    alias(libs.plugins.hilt) apply false
    alias(libs.plugins.googleServices) apply false
}

tasks.register("clean", Delete::class) {
    delete(rootProject.buildDir)
}