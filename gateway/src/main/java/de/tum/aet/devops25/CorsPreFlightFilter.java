package de.tum.aet.devops25;

import org.springframework.core.Ordered;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;

import reactor.core.publisher.Mono;

@Component
public class CorsPreFlightFilter implements WebFilter, Ordered {

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE; // Run before security filters
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        if (HttpMethod.OPTIONS.equals(exchange.getRequest().getMethod())) {
            System.out.println("[CORS_DEBUG] Handling OPTIONS preflight request for: " + 
                             exchange.getRequest().getURI().getPath());
            
            // Add CORS headers for preflight response (matching CorsConfig.java)
            String origin = exchange.getRequest().getHeaders().getFirst("Origin");
            String allowedOrigins = "http://localhost:3000,http://localhost:4200,https://dev-aieventconcepter.student.k8s.aet.cit.tum.de,https://aieventconcepter.student.k8s.aet.cit.tum.de";
            
            // Check if origin is allowed
            if (origin != null && allowedOrigins.contains(origin)) {
                exchange.getResponse().getHeaders().add("Access-Control-Allow-Origin", origin);
            } else {
                exchange.getResponse().getHeaders().add("Access-Control-Allow-Origin", "http://localhost:3000"); // fallback
            }
            
            exchange.getResponse().getHeaders().add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            exchange.getResponse().getHeaders().add("Access-Control-Allow-Headers", "*"); // Match CorsConfig
            exchange.getResponse().getHeaders().add("Access-Control-Expose-Headers", "Authorization, Content-Type");
            exchange.getResponse().getHeaders().add("Access-Control-Allow-Credentials", "true");
            exchange.getResponse().getHeaders().add("Access-Control-Max-Age", "3600");
            
            exchange.getResponse().setStatusCode(HttpStatus.OK);
            return exchange.getResponse().setComplete();
        }
        
        return chain.filter(exchange);
    }
} 