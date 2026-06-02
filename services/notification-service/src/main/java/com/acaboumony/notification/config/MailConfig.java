package com.acaboumony.notification.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.util.Properties;

@Configuration
public class MailConfig {

    @Value("${spring.mail.host:localhost}")
    private String host;

    @Value("${spring.mail.port:3025}")
    private int port;

    @Value("${spring.mail.username:}")
    private String username;

    @Value("${spring.mail.password:}")
    private String password;

    @Value("${spring.mail.protocol:smtp}")
    private String protocol;

    @Value("${mail.smtp.connection-timeout:5000}")
    private int connectionTimeout;

    @Value("${mail.smtp.timeout:5000}")
    private int timeout;

    @Value("${mail.smtp.write-timeout:5000}")
    private int writeTimeout;

    @Bean
    public JavaMailSender javaMailSender() {
        var mailSender = new JavaMailSenderImpl();
        mailSender.setHost(host);
        mailSender.setPort(port);
        mailSender.setProtocol(protocol);

        if (username != null && !username.isBlank()) {
            mailSender.setUsername(username);
            mailSender.setPassword(password);
        }

        var props = mailSender.getJavaMailProperties();
        props.put("mail.smtp.connectiontimeout", String.valueOf(connectionTimeout));
        props.put("mail.smtp.timeout", String.valueOf(timeout));
        props.put("mail.smtp.writetimeout", String.valueOf(writeTimeout));
        props.put("mail.smtp.auth", username != null && !username.isBlank());
        props.put("mail.smtp.starttls.enable", true);
        props.put("mail.smtp.starttls.required", true);
        props.put("mail.debug", false);

        return mailSender;
    }
}
