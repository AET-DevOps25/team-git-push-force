package de.tum.aet.devops25.usersvc;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable()) // Disable CSRF for APIs
                .headers(headers -> headers
                .frameOptions(frameOptions -> frameOptions.sameOrigin()) // Allow frames from same origin
                )
                .formLogin(form -> form.disable()) // <--- Add this line
                .httpBasic(httpBasic -> httpBasic.disable()) // <--- And this line
                .authorizeHttpRequests(authz -> authz
                .requestMatchers("/", "/api/users/register", "/api/users/login", "/health").permitAll()
                .anyRequest().authenticated()
                )
                // Register your JWT filter here:
                .addFilterBefore(new JwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
