cmake_minimum_required(VERSION 3.24)
project(vlaina_rtc VERSION 0.1.0 LANGUAGES C CXX)

add_library(eigen INTERFACE)
add_library(Eigen3::Eigen ALIAS eigen)
target_include_directories(eigen SYSTEM INTERFACE
  "${CMAKE_CURRENT_LIST_DIR}/vendor/eigen")
set_property(TARGET eigen PROPERTY INTERFACE_DIRECTORIES
  "${CMAKE_CURRENT_LIST_DIR}/vendor/eigen")
target_compile_definitions(eigen INTERFACE EIGEN_MPL2_ONLY)
set(eigen_POPULATED TRUE)
if(NOT CMAKE_CURRENT_SOURCE_DIR STREQUAL CMAKE_SOURCE_DIR)
  set(eigen_POPULATED TRUE PARENT_SCOPE)
endif()

include(FetchContent)

function(vlaina_rtc_dependencies)
  set(BUILD_SHARED_LIBS OFF)
  set(ENABLE_PROGRAMS OFF CACHE BOOL "" FORCE)
  set(ENABLE_TESTING OFF CACHE BOOL "" FORCE)
  set(MBEDTLS_FATAL_WARNINGS OFF CACHE BOOL "" FORCE)
  set(DISABLE_PACKAGE_CONFIG_AND_INSTALL ON CACHE BOOL "" FORCE)
  FetchContent_Declare(vlaina_phone_mbedtls
    GIT_REPOSITORY https://github.com/Mbed-TLS/mbedtls.git
    GIT_TAG e185d7fd85499c8ce5ca2a54f5cf8fe7dbe3f8df
    GIT_SUBMODULES framework
    GIT_SUBMODULES_RECURSE TRUE
    EXCLUDE_FROM_ALL)
  FetchContent_MakeAvailable(vlaina_phone_mbedtls)
  foreach(phone_mbedtls_target IN ITEMS mbedtls mbedx509 mbedcrypto)
    target_compile_definitions(${phone_mbedtls_target} PUBLIC MBEDTLS_SSL_DTLS_SRTP)
  endforeach()
  if(NOT TARGET MbedTLS::MbedTLS)
    add_library(MbedTLS::MbedTLS INTERFACE IMPORTED GLOBAL)
    set_target_properties(MbedTLS::MbedTLS PROPERTIES
      INTERFACE_LINK_LIBRARIES "mbedtls;mbedx509;mbedcrypto")
  endif()
  set(USE_MBEDTLS ON CACHE BOOL "" FORCE)
  set(USE_GNUTLS OFF CACHE BOOL "" FORCE)
  set(USE_NICE OFF CACHE BOOL "" FORCE)
  set(USE_SYSTEM_JUICE OFF CACHE BOOL "" FORCE)
  set(USE_SYSTEM_USRSCTP OFF CACHE BOOL "" FORCE)
  set(USE_SYSTEM_PLOG OFF CACHE BOOL "" FORCE)
  set(PLOG_BUILD_SAMPLES OFF CACHE BOOL "" FORCE)
  set(PLOG_BUILD_TESTS OFF CACHE BOOL "" FORCE)
  set(PLOG_INSTALL OFF CACHE BOOL "" FORCE)
  set(sctp_build_programs OFF CACHE BOOL "" FORCE)
  set(sctp_build_fuzzer OFF CACHE BOOL "" FORCE)
  set(NO_MEDIA ON CACHE BOOL "" FORCE)
  set(NO_WEBSOCKET OFF CACHE BOOL "" FORCE)
  set(NO_EXAMPLES ON CACHE BOOL "" FORCE)
  set(NO_TESTS ON CACHE BOOL "" FORCE)
  set(RTC_UPDATE_VERSION_HEADER OFF CACHE BOOL "" FORCE)
  add_subdirectory("${CMAKE_CURRENT_FUNCTION_LIST_DIR}/vendor/libdatachannel"
    "${CMAKE_CURRENT_BINARY_DIR}/libdatachannel" EXCLUDE_FROM_ALL)
  if(CMAKE_SYSTEM_NAME STREQUAL "Linux")
    foreach(phone_juice_target IN ITEMS juice juice-static)
      if(TARGET ${phone_juice_target})
        target_compile_definitions(${phone_juice_target} PRIVATE _DEFAULT_SOURCE)
      endif()
    endforeach()
  endif()
endfunction()

vlaina_rtc_dependencies()
