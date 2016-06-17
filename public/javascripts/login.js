;(function () {
  var app = {
    init: function () {
      this.form.setup()
      $(':input').change(function (e) {
        $(this).parents('.control-group').removeClass('error')
        $(this).popover('destroy')
      })

      $('#apollo-register-form').validate({
        rules: {
          name: {
            required: true,
            minlength: 5
          },
          email: {
            required: true,
            email: true
          },
          password: {
            required: true,
            minlength: 5
          }
        },
        messages: {
          name: 'Enter your fullname',
          email: 'Enter a valid email',
          password: {
            required: 'Provide a password',
            rangelength: jQuery.format('Enter at least {0} characters')
          },
          access_code: 'Access code from your email',
          agree_terms: 'Please read and agree to our terms'
        },
        highlight: function (element, errorClass) {
          $(element).parents('.control-group').removeClass('success').addClass('error')
        },
        unhighlight: function (element, errorClass) {
          $(element).parents('.control-group').removeClass('error')
        }
      })
    },
    form: {
      setup: function () {
        $('.register-link').click(function (e) {
          e.preventDefault()
          $('.apollo-login').fadeOut(350, function () {
            $('.apollo-register #email').val($('.apollo-login #email').val())
            $('.apollo-register').fadeIn(350, function () {
              $('.apollo-register input:first').focus()
              window.document.title = 'Sign up | CoLearnr'
            })
            $('.apollo').addClass('register')
          })
        })

        var urlemail = queryObj()['email']
        if (urlemail) {
          urlemail = decodeURIComponent(urlemail)
          $('.apollo-register #email').val(urlemail)
        }

        $('.apollo-register-account .register-link').click(function (e) {
          e.preventDefault()
          $('.apollo-login:visible, .apollo-forgotten-password:visible').fadeOut(350, function () {
            $('.apollo-register').fadeIn(350)
            $('.apollo-register input:first').focus()
            window.document.title = 'Sign up | CoLearnr'
            $('.apollo').removeClass('forgotten-password')
            $('.apollo').addClass('register')
          })
        })

        $('.apollo-back a').click(function (e) {
          e.preventDefault()
          $('.apollo-register:visible, .apollo-forgotten-password:visible').fadeOut(350, function () {
            var login = $('.apollo-login'),
              email = login.find('[type="email"]').parents('.control-group'),
              password = login.find('[type="password"]').parents('.control-group')
            email.find('input').popover('destroy')
            password.find('input').popover('destroy')
            $('.apollo-login').fadeIn(350)
            $('.apollo-login input:first').focus()
            window.document.title = 'Login | CoLearnr'
            $('.apollo').removeClass('register forgotten-password')
          })
        })

        $('.apollo-register-account .password-link').click(function (e) {
          e.preventDefault()

          $('.apollo-login').fadeOut(350, function () {
            $('.apollo-forgotten-password #email').val($('.apollo-login #email').val())
            $('.apollo-forgotten-password').fadeIn(350, function () {
              $('.apollo-forgotten-password input:first').focus()
            })
            window.document.title = 'Forgot password | CoLearnr'
            $('.apollo').addClass('forgotten-password')
            $('.apollo').removeClass('register')
          })
        })

        $('#apollo-forgotten-password-form').submit(function (e) {
          e.preventDefault()

          app.form.handleForgottenPassword($(this))
        })

        $('#apollo-login-form').submit(function (e) {
          e.preventDefault()

          app.form.handleStandardLogin($(this))
        })
      },

      handleStandardLogin: function (form) {
        app.checkUserAccount('standard', form)
      },
      handleForgottenPassword: function (form) {
        if (app.checkUserAccount('forgottenPassword', form)) {
          $('.apollo-forgotten-password').fadeOut(350, function () {
            $('.apollo-password-reset').fadeIn(350)
          })
        }else {
          var fPassword = $('.apollo-forgotten-password'),
            email = fPassword.find('[type="email"]:first').parents('.control-group')
          var emailVal = email.find('input').val()
          if (!emailVal || /^\s*$/.test(emailVal)) {
            email.addClass('error').find('input').popover({
              title: 'Oops!',
              content: 'We need your email for resetting your password!',
              trigger: 'manual',
              placement: 'top'
            }).popover('show')
            return false
          }
          var data = form.serialize()
          $.post('/password/reset', data).done(function (data) {
            if (data.success) {
              email.addClass('info').find('input').popover({
                title: 'Check your email!',
                content: 'We have just emailed you with instructions about resetting your password!',
                trigger: 'manual',
                placement: 'top'
              }).popover('show')
            }
            return true
          }).error(function (xhr, status, data) {
            var resp = xhr.responseText
            var message = ''
            try {
              message = JSON.parse(resp).message
            } catch (e) {}
            if ('INVALID_EMAIL' == message) {
              email.addClass('error').find('input').popover({
                title: 'Invalid email!',
                content: 'That email is invalid. Please contact support.',
                trigger: 'manual',
                placement: 'top'
              }).popover('show')
              return false
            }
            else if ('ALREADY_REQUESTED' == message) {
              email.addClass('error').find('input').popover({
                title: 'Reset already requested!',
                content: "You have already requested a password reset. Please contact support if you didn't receive the reset email.",
                trigger: 'manual',
                placement: 'top'
              }).popover('show')
              return false
            }
          })
        }
      }
    },
    checkUserAccount: function (loginType, form) {
      var login = $('.apollo-login'),
        email = login.find('[type="email"]').parents('.control-group'),
        password = login.find('[type="password"]').parents('.control-group')
      var emailVal = email.find('input').val()
      var passVal = password.find('input').val()

      email.removeClass('error')
      password.removeClass('error')
      email.find('input').popover('destroy')
      password.find('input').popover('destroy')
      if (!emailVal || /^\s*$/.test(emailVal)) {
        email.addClass('error').find('input').popover({
          title: 'Oops!',
          content: 'We need both email and password!',
          trigger: 'manual',
          placement: 'top'
        }).popover('show')
        return false
      }
      else if (!passVal || /^\s*$/.test(passVal)) {
        password.addClass('error').find('input').popover({
          title: 'Password please!',
          content: 'Hate typing password? Use login with LinkedIn or Twitter!',
          trigger: 'manual',
          placement: 'top'
        }).popover('show')
        return false
      }

      var data = form.serialize()
      switch (loginType) {
        case 'standard':
          $.post('/login', data).done(function (data) {
            if (data.redirectUrl) {
              window.location.href = data.redirectUrl
            }
            return true
          }).error(function (xhr, status, data) {
            var resp = xhr.responseText
            var message = ''
            try {
              message = JSON.parse(resp).message
            } catch (e) {}
            if ('NO_EMAIL' == message) {
              password.addClass('error')
              email.addClass('error').find('input').popover({
                html: true,
                title: 'That email is new to us!',
                content: 'Would you like to register?<br><button id="qregister" class="btn btn-primary" type="button">Yes</button>&nbsp;<button id="qno" class="btn-link" type="button">No</button>',
                placement: 'top'
              }).popover('show').parent().delegate('button#qregister', 'click', function () {
                $('.apollo-login').fadeOut(350, function () {
                  $('.apollo-register #email').val($('.apollo-login #email').val())
                  $('.apollo-register').fadeIn(350, function () {
                    $('.apollo-register input:first').focus()
                    window.document.title = 'Sign up | CoLearnr'
                  })
                  $('.apollo').addClass('register')
                })
              })
              email.parent().delegate('button#qno', 'click', function () {
                email.find('input').popover('destroy')
              })
              return false
            } else if ('INVALID_PASS' == message) {
              email.addClass('error')
              password.addClass('error').find('input').popover({
                title: 'Invalid Password!',
                html: true,
                content: 'Did you forget your password?<br><button id="qforgot" class="btn btn-primary" type="button">Yes</button>&nbsp;<button id="qno" class="btn-link" type="button">No</button>',
                trigger: 'manual',
                placement: 'top'
              }).popover('show').parent().delegate('button#qforgot', 'click', function () {
                $('.apollo-login').fadeOut(350, function () {
                  $('.apollo-forgotten-password #email').val($('.apollo-login #email').val())
                  $('.apollo-forgotten-password').fadeIn(350, function () {
                    $('.apollo-forgotten-password input:first').focus()
                    window.document.title = 'Forgot password | CoLearnr'
                  })
                  $('.apollo').addClass('forgotten-password')
                  $('.apollo').removeClass('register')
                })
              })
              password.parent().delegate('button#qno', 'click', function () {
                password.find('input').popover('destroy')
              })
              return false
            } else if ('INVALID_EMAIL' == message) {
              password.addClass('error')
              email.addClass('error').find('input').popover({
                title: 'Oops!',
                content: 'Invalid email',
                trigger: 'manual',
                placement: 'top'
              }).popover('show')
              return false
            }
          })
          break
      }
      return false
    },
    domReady: function () {},
    windowLoad: function () {}
  }

  app.init()
  $(function () {
    app.domReady()
    $(window).load(app.windowLoad)
  })

  ;(function () {
    var numX = 50,
      numY = 40,
      nhood = 1,
      nhoodSize = (2 * nhood + 1) * (2 * nhood + 1) - 1, // neighbourhood size
      wd = 375,
      ht = wd * numY / numX

    var margin = {
        top: 5,
        right: 20,
        bottom: 5,
        left: 2
      },
      width = wd - margin.left - margin.right,
      height = ht - margin.top - margin.bottom

    var svg = d3.select('#nodes').append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

    var formatNumber = d3.format('.1f')

    var gridSizeX = width / numX,
      gridSizeY = height / numY

    //   init()

    var dataset = {
      nodes: [{
        name: 'Project'
      }, {
        name: 'Research'
      }, {
        name: 'Personal topic'
      }, {
        name: 'Conference'
      }, {
        name: 'Marketing'
      }, {
        name: 'Sales'
      }, {
        name: 'Hobby'
      }, {
        name: 'Technology'
      }, {
        name: 'Cloud'
      }, {
        name: 'IoT'
      }],
      edges: [{
        source: 0,
        target: 1
      }, {
        source: 0,
        target: 2
      }, {
        source: 0,
        target: 3
      }, {
        source: 0,
        target: 4
      }, {
        source: 1,
        target: 3
      }, {
        source: 2,
        target: 4
      }, {
        source: 2,
        target: 5
      }, {
        source: 3,
        target: 4
      }, {
        source: 5,
        target: 3
      }, {
        source: 5,
        target: 9
      }, {
        source: 6,
        target: 7
      }, {
        source: 7,
        target: 8
      }, {
        source: 8,
        target: 3
      }]
    }

    var colors = d3.scale.category10()

    var force = d3.layout.force()
      .nodes(dataset.nodes)
      .links(dataset.edges)
      .size([wd, ht])
      .linkDistance([50])
      .charge([-100])
      .start()

    var edges = svg.selectAll('line').data(dataset.edges)
      .enter()
      .append('line')
      .style('stroke', '#ccc')
      .style('stroke-width', 1)

    var nodes = svg.selectAll('circle').data(dataset.nodes)
      .enter()
      .append('circle')
      .attr('x', 100).attr('y', 100)
      .attr('r', 18)
      .style('fill', function (d, i) {
        return colors(i)
      })
      .call(force.drag)

    force.on('tick', function () {
      edges.attr('x1', function (d) {
        return d.source.x
      })
        .attr('y1', function (d) {
          return d.source.y
        })
        .attr('x2', function (d) {
          return d.target.x
        })
        .attr('y2', function (d) {
          return d.target.y
        })
      nodes.attr('cx', function (d) {
        return d.x
      })
        .attr('cy', function (d) {
          return d.y
        })
    })
  })()
})(jQuery)
