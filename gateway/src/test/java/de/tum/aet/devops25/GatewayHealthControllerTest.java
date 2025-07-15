package de.tum.aet.devops25;

import de.tum.aet.devops25.api.generated.model.GetGatewayHealth200Response;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
class GatewayHealthControllerTest {

    @Autowired
    private GatewayHealthController gatewayHealthController;

    private ServerWebExchange exchange;

    @BeforeEach
    void setUp() {
        // Create a mock ServerWebExchange
        MockServerHttpRequest request = MockServerHttpRequest.get("/").build();
        exchange = MockServerWebExchange.from(request);
    }

    @Test
    void contextLoads() {
        // This test verifies that the Spring Boot application context can be loaded successfully
    }

    @Test
    void testGetGatewayHealth() {
        // Test the getGatewayHealth method of the GatewayHealthController
        Mono<ResponseEntity<GetGatewayHealth200Response>> responseMono = gatewayHealthController.getGatewayHealth(exchange);
        ResponseEntity<GetGatewayHealth200Response> response = responseMono.block();

        // Verify that the response is not null
        assertNotNull(response);
        assertNotNull(response.getBody());

        // Verify that the status is "UP"
        assertEquals("UP", response.getBody().getStatus());

        // Verify that the timestamp is not null
        assertNotNull(response.getBody().getTimestamp());
    }
}
