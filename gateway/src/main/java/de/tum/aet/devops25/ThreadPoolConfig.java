package de.tum.aet.devops25;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;

import java.util.concurrent.Executors;

@Configuration
public class ThreadPoolConfig {

    @Bean
    public Scheduler blockingOperationsScheduler() {
        // Use boundedElastic scheduler which is designed for blocking tasks
        // This scheduler creates and caches a pool of threads
        // and reuses idle threads when possible
        return Schedulers.boundedElastic();
    }
}
